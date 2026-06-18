import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 400 });
    }

    const rawBody = await req.text();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret === 'webhook_secret_placeholder' || webhookSecret.trim() === '') {
      console.error('[webhook] RAZORPAY_WEBHOOK_SECRET is not configured or set to placeholder.');
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[webhook] Signature mismatch');
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
    }

    const eventData = JSON.parse(rawBody);
    const event = eventData.event;
    console.log(`[webhook] Received event: ${event}`);

    const payload = eventData.payload;

    if (event === 'subscription.charged' || event === 'payment.captured') {
      const subEntity = payload.subscription?.entity;
      const paymentEntity = payload.payment?.entity;
      
      const subscriptionId = subEntity?.id || paymentEntity?.subscription_id;
      const paymentId = paymentEntity?.id;
      const amount = paymentEntity ? paymentEntity.amount / 100 : 0.00;
      const currency = paymentEntity?.currency || 'INR';

      // Notes contain metadata securely populated on order creation
      const notes = subEntity?.notes || paymentEntity?.notes || {};
      const userId = notes.user_id;
      const planType = notes.plan_type || 'pro';
      const workspaceId = notes.workspace_id || null;

      if (!userId) {
        console.warn('[webhook] Missing user_id metadata in event notes');
        return NextResponse.json({ success: true, warning: 'No user metadata found' });
      }

      // Calculate current period end
      const periodEndUnix = subEntity?.current_end;
      const currentPeriodEnd = periodEndUnix 
        ? new Date(periodEndUnix * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default +30 days

      // Find pending transaction matching subscription_id
      let txId = null;
      const { data: existingPendingTx } = await supabaseAdmin
        .from('billing_transactions')
        .select('id')
        .eq('subscription_id', subscriptionId)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingPendingTx) {
        txId = existingPendingTx.id;
        await supabaseAdmin
          .from('billing_transactions')
          .update({
            status: 'paid',
            payment_id: paymentId
          })
          .eq('id', txId);
      } else {
        // Renewal or webhook-first flow: Create new paid transaction directly
        const { data: newTx } = await supabaseAdmin
          .from('billing_transactions')
          .insert({
            user_id: userId,
            workspace_id: workspaceId,
            provider: 'razorpay',
            plan_type: planType,
            amount: amount || (planType === 'pro' ? 2499.00 : 7499.00),
            currency: currency,
            payment_id: paymentId,
            subscription_id: subscriptionId,
            status: 'paid'
          })
          .select('id')
          .single();
        if (newTx) txId = newTx.id;
      }

      // Generate invoice receipt
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      await Promise.all([
        // Upsert active subscription details
        supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_type: planType,
            status: 'active',
            razorpay_subscription_id: subscriptionId,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' }),

        // Create Invoice details
        supabaseAdmin
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            user_id: userId,
            transaction_id: txId,
            plan_type: planType,
            amount: amount || (planType === 'pro' ? 2499.00 : 7499.00),
            currency: currency,
            tax_amount: parseFloat(((amount || (planType === 'pro' ? 2499.00 : 7499.00)) * 0.18).toFixed(2)),
            status: 'paid'
          })
      ]);

      console.log(`[webhook] Successfully activated subscription for user: ${userId}`);
    } 
    else if (event === 'subscription.cancelled') {
      const subEntity = payload.subscription.entity;
      const subscriptionId = subEntity.id;
      const notes = subEntity.notes || {};
      const userId = notes.user_id;

      if (userId) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        console.log(`[webhook] Cancelled subscription for user: ${userId}`);
      }
    } 
    else if (event === 'subscription.paused') {
      const subEntity = payload.subscription.entity;
      const subscriptionId = subEntity.id;
      const notes = subEntity.notes || {};
      const userId = notes.user_id;

      if (userId) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        console.log(`[webhook] Paused subscription for user: ${userId}`);
      }
    } 
    else if (event === 'subscription.resumed') {
      const subEntity = payload.subscription.entity;
      const subscriptionId = subEntity.id;
      const notes = subEntity.notes || {};
      const userId = notes.user_id;
      const planType = notes.plan_type || 'pro';
      const periodEndUnix = subEntity.current_end;
      const currentPeriodEnd = periodEndUnix 
        ? new Date(periodEndUnix * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (userId) {
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_type: planType,
            status: 'active',
            razorpay_subscription_id: subscriptionId,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        console.log(`[webhook] Resumed subscription for user: ${userId}`);
      }
    } 
    else if (event === 'payment.failed') {
      const paymentEntity = payload.payment.entity;
      const subscriptionId = paymentEntity.subscription_id;

      if (subscriptionId) {
        await supabaseAdmin
          .from('billing_transactions')
          .update({ status: 'failed' })
          .eq('subscription_id', subscriptionId);
        console.log(`[webhook] Payment failure marked for subscription: ${subscriptionId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[webhook] Webhook exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

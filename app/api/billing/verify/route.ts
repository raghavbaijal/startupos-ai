import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClientFromRequest } from '@/lib/db/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isRecruiterModeAllowed(host: string): boolean {
  if (!host) return false;
  const cleanHost = host.toLowerCase();
  
  const isLocal = cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1') || cleanHost.includes('::1');
  
  return isLocal;
}

export async function POST(req: Request) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
    const { client, user } = await createClientFromRequest(req);

    if (!user && !isDemoMode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Determine Recruiter Mode
    const recruiterModeActive = isDemoMode;

    let verified = false;

    if (recruiterModeActive) {
      verified = true;
    } else {
      // Live Signature Verification
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret || secret === 'placeholder_secret' || secret.trim() === '') {
        console.error('[verify] RAZORPAY_KEY_SECRET is not configured or set to placeholder.');
        return NextResponse.json({ error: 'Billing gateway configuration error' }, { status: 500 });
      }
      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_payment_id + '|' + razorpay_subscription_id)
        .digest('hex');

      if (generated_signature === razorpay_signature) {
        verified = true;
      }
    }

    if (!verified) {
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    if (isDemoMode) {
      return NextResponse.json({ success: true, message: 'Demo mode verified successfully' });
    }

    // Fetch transaction record matching subscription_id
    const { data: tx, error: txError } = await supabaseAdmin
      .from('billing_transactions')
      .select('*')
      .eq('subscription_id', razorpay_subscription_id)
      .maybeSingle();

    if (txError || !tx) {
      console.error('[verify] Transaction fetch error or not found:', txError?.message);
      return NextResponse.json({ error: 'Matching checkout transaction not found' }, { status: 404 });
    }

    // Generate authoritative invoice number
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // 1. Mark transaction as paid (subscription status and invoices are handled authoritatively by webhooks)
    const { error: txUpdateError } = await supabaseAdmin
      .from('billing_transactions')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id
      })
      .eq('id', tx.id);

    if (txUpdateError) {
      console.error('[verify] DB transaction update error:', txUpdateError.message);
      return NextResponse.json({ error: 'Failed to record transaction status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[verify] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/db/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
    const { client, user } = await createClientFromRequest(req);

    if (!user && !isDemoMode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user?.id || 'mock-user-id';

    if (isDemoMode) {
      return NextResponse.json({ success: true });
    }

    // 1. Fetch user subscription to get Razorpay subscription ID
    const { data: sub, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (subError || !sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // 2. If it is a live Razorpay subscription, cancel it via SDK
    if (sub.razorpay_subscription_id && !sub.razorpay_subscription_id.startsWith('sub_mock_')) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || keyId === 'rzp_test_placeholder' || !keySecret || keySecret === 'placeholder_secret') {
        console.error('[cancel] Razorpay credentials are not configured.');
        return NextResponse.json({ error: 'Billing cancel configuration error' }, { status: 500 });
      }
      try {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });

        // Cancel Razorpay Subscription
        await razorpay.subscriptions.cancel(sub.razorpay_subscription_id, false);
      } catch (rzpErr: any) {
        console.warn('[cancel] Razorpay SDK cancel warning (may be already cancelled in dashboard):', rzpErr.message);
      }
    }

    // 3. Update database subscription state (keep plan_type and current_period_end intact for grace period access)
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[cancel] Database update error:', updateError.message);
      return NextResponse.json({ error: 'Failed to update subscription in database' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[cancel] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

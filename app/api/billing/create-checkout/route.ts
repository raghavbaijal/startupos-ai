import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClientFromRequest } from '@/lib/db/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

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
    let activeUser = user;
    if (!activeUser && isDemoMode) {
      activeUser = { id: 'mock-user-id', email: 'demo-founder@startupos.ai' } as any;
    }

    if (!activeUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_type, workspace_id } = await req.json();

    if (plan_type !== 'pro' && plan_type !== 'team') {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Determine Recruiter Mode
    const recruiterModeActive = isDemoMode;

    if (recruiterModeActive) {
      // Recruiter / Demo Mode Bypass
      const mockSubId = `sub_mock_${Math.random().toString(36).substring(7)}`;
      const userId = activeUser.id;
      
      if (!isDemoMode) {
        // Log transaction as pending in real database for simulated purchase
        await supabaseAdmin.from('billing_transactions').insert({
          user_id: userId,
          workspace_id: workspace_id || null,
          provider: 'razorpay',
          plan_type: plan_type,
          amount: plan_type === 'pro' ? 2499.00 : 7499.00,
          currency: 'INR',
          subscription_id: mockSubId,
          status: 'pending'
        });
      }

      return NextResponse.json({
        success: true,
        recruiterMode: true,
        subscription_id: mockSubId,
        amount: plan_type === 'pro' ? 249900 : 749900,
        currency: 'INR',
        key_id: 'rzp_test_mockkey'
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || keyId === 'rzp_test_placeholder' || !keySecret || keySecret === 'placeholder_secret') {
      console.error('[create-checkout] Razorpay credentials are not configured.');
      return NextResponse.json({ error: 'Billing checkout configuration error' }, { status: 500 });
    }

    const planId = plan_type === 'pro' ? process.env.RAZORPAY_PLAN_PRO : process.env.RAZORPAY_PLAN_TEAM;
    if (!planId || planId.includes('mock') || planId.trim() === '') {
      console.error(`[create-checkout] Plan ID for ${plan_type} is not configured.`);
      return NextResponse.json({ error: 'Billing checkout plan configuration error' }, { status: 500 });
    }

    // Live Razorpay Subscription Flow
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    // Create Subscription via Razorpay SDK
    const sub = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      quantity: 1,
      notes: {
        user_id: activeUser.id,
        workspace_id: workspace_id || '',
        plan_type
      }
    });

    // Write transaction log to DB
    const { error: txError } = await supabaseAdmin.from('billing_transactions').insert({
      user_id: activeUser.id,
      workspace_id: workspace_id || null,
      provider: 'razorpay',
      plan_type: plan_type,
      amount: plan_type === 'pro' ? 2499.00 : 7499.00,
      currency: 'INR',
      subscription_id: sub.id,
      status: 'pending'
    });

    if (txError) {
      console.error('[create-checkout] Database insertion error:', txError.message);
      return NextResponse.json({ error: 'Database transaction initialization failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      recruiterMode: false,
      subscription_id: sub.id,
      amount: plan_type === 'pro' ? 249900 : 749900,
      currency: 'INR',
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    });
  } catch (err: any) {
    console.error('[create-checkout] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

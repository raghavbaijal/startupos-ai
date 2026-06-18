'use server';

import { createClient } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Subscription {
  id?: string;
  user_id: string;
  plan_type: 'free' | 'pro' | 'team';
  status: 'active' | 'inactive' | 'canceled' | 'trialing';
  razorpay_subscription_id?: string | null;
  stripe_subscription_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Retrieves the current user's subscription details.
 * Falls back to "free" tier gracefully if table does not exist.
 */
export async function getUserSubscription(): Promise<Subscription> {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    return { user_id: 'mock-user-id', plan_type: 'free', status: 'active' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user_id: '', plan_type: 'free', status: 'inactive' };

    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      // If table doesn't exist, we will catch it and return free
      console.warn('[getUserSubscription] Database query warning (likely table not migrated yet):', error.message);
      return { user_id: user.id, plan_type: 'free', status: 'active' };
    }

    if (!sub) {
      return { user_id: user.id, plan_type: 'free', status: 'active' };
    }

    // Dynamic grace period check
    if (sub.plan_type !== 'free' && sub.current_period_end) {
      const isExpired = new Date(sub.current_period_end) < new Date();
      if (isExpired) {
        return {
          ...sub,
          plan_type: 'free',
          status: 'inactive'
        };
      }
    }

    return sub;
  } catch (err) {
    console.error('[getUserSubscription] Exception:', err);
    return { user_id: '', plan_type: 'free', status: 'active' };
  }
}

/**
 * Creates/Updates user subscription details (simulating or executing Razorpay/Stripe updates).
 */
export async function subscribeToPlan(planType: 'free' | 'pro' | 'team'): Promise<{ success: boolean; error?: string }> {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    return { success: true };
  }
  return { success: false, error: 'Direct subscription updates are disabled in production. Please use the checkout gateway.' };
}

/**
 * Performs limits checks dynamically on the database.
 */
export async function checkUsageLimit(
  actionType: 'workspace' | 'document' | 'generation' | 'collaboration',
  workspaceId?: string,
  callerUserId?: string
): Promise<{ allowed: boolean; message?: string; count?: number; limit?: number }> {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    return { allowed: true };
  }

  try {
    let activeUserId = callerUserId;

    if (!activeUserId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        activeUserId = user.id;
      }
    }

    if (!activeUserId && actionType === 'workspace') {
      return { allowed: false, message: 'Unauthorized. Please sign in.' };
    }

    // 1. Determine subscription plan type from workspace owner or active user
    let plan = 'free';
    if (workspaceId) {
      const { data: ws } = await supabaseAdmin
        .from('workspaces')
        .select('user_id')
        .eq('id', workspaceId)
        .maybeSingle();

      if (ws) {
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('user_id', ws.user_id)
          .maybeSingle();
        if (sub) {
          const isExpired = sub.plan_type !== 'free' && sub.current_period_end && new Date(sub.current_period_end) < new Date();
          plan = isExpired ? 'free' : (sub.plan_type || 'free');
        }
      }
    } else if (activeUserId) {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', activeUserId)
        .maybeSingle();
      if (sub) {
        const isExpired = sub.plan_type !== 'free' && sub.current_period_end && new Date(sub.current_period_end) < new Date();
        plan = isExpired ? 'free' : (sub.plan_type || 'free');
      }
    }

    if (plan === 'pro' || plan === 'team') {
      return { allowed: true };
    }

    // Free Plan Enforcements
    if (actionType === 'workspace') {
      const { count, error } = await supabaseAdmin
        .from('workspaces')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', activeUserId);

      const currentWorkspaces = count || 0;
      if (currentWorkspaces >= 1) {
        return {
          allowed: false,
          message: 'Free tier is limited to 1 workspace. Upgrade to Pro or Team to create more.',
          count: currentWorkspaces,
          limit: 1
        };
      }
    }

    if (actionType === 'document') {
      if (!workspaceId) {
        return { allowed: false, message: 'Workspace ID required to verify document limit.' };
      }
      const { count, error } = await supabaseAdmin
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      const currentDocs = count || 0;
      if (currentDocs >= 1) {
        return {
          allowed: false,
          message: 'Free tier is limited to 1 document upload. Upgrade to Pro or Team to upload more files.',
          count: currentDocs,
          limit: 1
        };
      }
    }

    if (actionType === 'generation') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: workspaces } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .eq('user_id', activeUserId);

      const workspaceIds = workspaces?.map(w => w.id) || [];
      let totalGenerations = 0;

      if (workspaceIds.length > 0) {
        const { count: jobsVal } = await supabaseAdmin
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .in('workspace_id', workspaceIds)
          .gte('created_at', startOfMonth.toISOString());
        
        totalGenerations += (jobsVal || 0);

        const { count: eventsVal } = await supabaseAdmin
          .from('workspace_events')
          .select('*', { count: 'exact', head: true })
          .in('workspace_id', workspaceIds)
          .in('event_type', ['chat', 'branding', 'finance', 'marketing', 'roadmap', 'pitchdeck', 'landingpage'])
          .gte('created_at', startOfMonth.toISOString());

        totalGenerations += (eventsVal || 0);
      }

      if (totalGenerations >= 10) {
        return {
          allowed: false,
          message: 'Free tier is limited to 10 AI generations per month. Upgrade to Pro or Team for unlimited access.',
          count: totalGenerations,
          limit: 10
        };
      }
      return { allowed: true, count: totalGenerations, limit: 10 };
    }

    if (actionType === 'collaboration') {
      return {
        allowed: false,
        message: 'Advanced collaboration features (invitations, comments, and version snapshots) are restricted to Pro or Team plans. Upgrade now to collaborate with your team!'
      };
    }

    return { allowed: true };
  } catch (err: any) {
    console.error('[checkUsageLimit] Exception checking limits:', err);
    return { allowed: true };
  }
}

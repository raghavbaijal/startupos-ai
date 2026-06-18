import { redirect } from 'next/navigation';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/db/server';
import { acceptInvitation } from '@/app/workspace-actions';
import { logout } from '@/app/auth-actions';
import { Shield, Users, ArrowRight, UserPlus, LogOut } from 'lucide-react';
import Link from 'next/link';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvitationPage(props: PageProps) {
  const { id: inviteId } = await props.params;

  // 1. Fetch invitation details using admin client
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('workspace_invitations')
    .select('*, workspaces(name)')
    .eq('id', inviteId)
    .single();

  if (inviteError || !invite) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA] text-slate-900">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl text-center border border-slate-200 bg-white">
          <div className="inline-flex p-3 bg-red-50 rounded-2xl border border-red-100 text-red-500 mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-sans font-bold text-slate-800">Invalid Invitation</h1>
          <p className="text-xs text-slate-500 mt-2">
            This invitation link is invalid, has been revoked, or has expired. Please contact your workspace administrator.
          </p>
          <Link href="/" className="mt-6 inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 2. Fetch logged-in user session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const workspaceName = invite.workspaces?.name || 'Workspace';
  const inviteEmail = invite.email;
  const inviteRole = invite.role;

  // Server action triggers on form submit
  const handleAccept = async () => {
    'use server';
    const res = await acceptInvitation(inviteId);
    if (res.success && res.workspaceId) {
      redirect(`/workspaces/${res.workspaceId}`);
    } else {
      redirect(`/invitations/${inviteId}?error=${encodeURIComponent(res.error || 'Failed to accept invitation.')}`);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA] text-slate-900">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative border border-slate-200 bg-white shadow-sm">
        {/* Banner strip */}
        <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-t-3xl" />

        <div className="text-center mb-6 pt-2">
          <div className="inline-flex p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-650 mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-sans font-bold text-slate-850 tracking-tight">
            Team Invitation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            You have been invited to join <span className="font-bold text-slate-800">{workspaceName}</span>
          </p>
        </div>

        {/* Invite Info Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 mb-6 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Workspace</span>
            <span className="font-bold text-slate-800">{workspaceName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Your Role</span>
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 rounded-full capitalize">
              {inviteRole}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Recipient Email</span>
            <span className="font-bold text-slate-800">{inviteEmail}</span>
          </div>
        </div>

        {/* Acceptance Logic based on Auth State */}
        {!user ? (
          /* Case A: Not logged in */
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-700 leading-normal">
              You are currently logged out. Please sign in or create an account with <strong>{inviteEmail}</strong> to accept this invitation.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/login?message=${encodeURIComponent('Log in to accept your team invitation.')}`}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition-all"
              >
                Log In
              </Link>
              <Link
                href={`/signup?email=${encodeURIComponent(inviteEmail)}`}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Create Account
              </Link>
            </div>
          </div>
        ) : user.email?.toLowerCase() !== inviteEmail.toLowerCase() ? (
          /* Case B: Logged in as different user */
          <div className="space-y-4">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-750 leading-relaxed">
              This invitation is meant for <strong>{inviteEmail}</strong>, but you are logged in as <strong>{user.email}</strong>. Please sign out and log in with the correct email.
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 hover:bg-red-50 text-red-650 rounded-xl text-xs font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out & Switch Accounts
              </button>
            </form>
          </div>
        ) : (
          /* Case C: Logged in correctly */
          <form action={handleAccept}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] group"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              Accept Invite & Enter Workspace
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

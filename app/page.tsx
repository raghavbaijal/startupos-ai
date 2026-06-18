import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import { logout } from '@/app/auth-actions';
import { LogOut, Plus, FolderKanban, Shield, ArrowRight, Layers, Sparkles, Zap, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import OnboardingWizard from '@/components/OnboardingWizard';
import ShowcaseLandingPage from '@/components/ShowcaseLandingPage';
import { getUserSubscription } from '@/app/billing-actions';

export default async function DashboardPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  let user = null;
  let workspaces: any[] = [];

  if (isDemoMode) {
    user = { id: 'mock-user-id', email: 'demo-founder@startupos.ai' };
    workspaces = [
      {
        id: 'demo-workspace-1',
        name: 'EcoThread India',
        industry: 'Sustainable Fashion',
        description: 'A direct-to-consumer apparel brand bringing organic, affordable cotton clothing to Indian college campuses.',
        budget: 50000,
        stage: 'branding',
        created_at: new Date().toISOString()
      }
    ];
  } else {
    const supabase = await createClient();
    const {
      data: { user: dbUser },
    } = await supabase.auth.getUser();
    user = dbUser;

    if (!user) {
      return <ShowcaseLandingPage />;
    }

    const { data: ownedWorkspaces } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id);

    const { data: memberRecords } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, workspaces(*)')
      .eq('user_id', user.id);

    const memberWorkspaces = (memberRecords?.map(m => {
      if (!m.workspaces) return null;
      return {
        ...(m.workspaces as any),
        membership_role: m.role
      };
    }).filter(Boolean) || []) as any[];

    const allWorkspaces = [
      ...(ownedWorkspaces || []).map(w => ({ ...w, membership_role: 'owner' })),
      ...memberWorkspaces.filter(mw => mw && !ownedWorkspaces?.some(ow => ow.id === mw.id))
    ];

    workspaces = allWorkspaces.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const sub = await getUserSubscription();
  const planType = sub?.plan_type || 'free';
  const ownedWorkspacesCount = isDemoMode 
    ? workspaces.length 
    : workspaces.filter(w => w.membership_role === 'owner').length;
  const isWorkspaceLimitReached = planType === 'free' && ownedWorkspacesCount >= 1;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative overflow-hidden text-slate-900">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                <Shield className="w-5 h-5 text-slate-800" />
              </div>
              <span className="font-sans font-bold text-lg text-slate-900 tracking-tight">
                StartupOS <span className="text-slate-550">AI</span>
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-4">
              <Link 
                href="/generator" 
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                AI Startup Generator
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Signed in as</p>
              <p className="text-xs font-semibold text-slate-700">{user.email}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold transition-all active:scale-[0.98] shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-tight">
              Startup Workspaces
            </h1>
            <p className="text-slate-550 text-sm mt-1">
              Create, view, and scale your AI co-founded ventures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/generator" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]">
              <Sparkles className="w-4 h-4 text-slate-500" />
              AI Idea Generator
            </Link>
            {isWorkspaceLimitReached ? (
              <Link href="/settings/billing" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.98]">
                <Zap className="w-4 h-4 text-white" />
                Upgrade to Create
              </Link>
            ) : (
              <Link href="/workspaces/new" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]">
                <Plus className="w-4 h-4" />
                New Workspace
              </Link>
            )}
          </div>
        </div>

        {isWorkspaceLimitReached && (
          <div className="mb-8 bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-800 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Workspace Limit Reached (Free Plan)</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  You are currently using 1 of your 1 allowed active workspaces on the Free tier. Upgrade to Pro or Team plan to create more workspaces and collaborate with teammates.
                </p>
              </div>
            </div>
            <Link href="/settings/billing" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-sm active:scale-[0.98]">
              <Zap className="w-3.5 h-3.5" />
              Upgrade Now
            </Link>
          </div>
        )}

        {/* Workspaces grid */}
        {!workspaces || workspaces.length === 0 ? (
          <OnboardingWizard />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/workspaces/${workspace.id}`}
                className="bg-white border border-slate-200 hover:border-slate-400 p-6 rounded-2xl transition-all group flex flex-col justify-between hover:shadow-sm relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
                        {workspace.industry}
                      </span>
                      {workspace.membership_role && workspace.membership_role !== 'owner' && (
                        <span className="inline-flex px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-600 capitalize">
                          {workspace.membership_role}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      {workspace.stage}
                    </span>
                  </div>
                  <h3 className="text-lg font-sans font-bold text-slate-900 mb-2">
                    {workspace.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {workspace.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Budget: ₹{parseFloat(workspace.budget).toLocaleString('en-IN')}</span>
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform text-slate-800 font-bold flex items-center gap-1">
                    Open OS
                    <ArrowRight className="w-3.5 h-3.5 text-slate-800" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

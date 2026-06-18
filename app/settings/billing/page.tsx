import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import BillingDashboardView from '@/components/BillingDashboardView';

export default async function SettingsBillingPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  let user: any = null;
  let subscription: any = null;
  let workspacesCount = 0;
  let documentsCount = 0;
  let documentsSize = 0;
  let aiGenerationsCount = 0;
  let teamMembersCount = 0;
  let transactions: any[] = [];
  let invoices: any[] = [];
  let analytics = {
    totalSpend: 0,
    monthlySpend: 0,
    avgCostPerRun: 0,
    mostExpensiveWorkflow: 'None',
    tokenConsumption: 0
  };

  if (isDemoMode) {
    user = { id: 'mock-user-id', email: 'demo-founder@startupos.ai' };
    subscription = { plan_type: 'pro', status: 'active', current_period_end: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() };
    workspacesCount = 1;
    documentsCount = 2;
    documentsSize = 60500;
    aiGenerationsCount = 4;
    teamMembersCount = 2;
    transactions = [
      { id: 'tx_demo_1', plan_type: 'pro', amount: 2499.00, currency: 'INR', status: 'paid', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), provider: 'razorpay', payment_id: 'pay_demo_12345' }
    ];
    invoices = [
      { id: 'inv_demo_1', invoice_number: 'INV-2026-9081', plan_type: 'pro', amount: 2499.00, currency: 'INR', tax_amount: 449.82, status: 'paid', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
    ];
    analytics = {
      totalSpend: 0.16,
      monthlySpend: 0.16,
      avgCostPerRun: 0.04,
      mostExpensiveWorkflow: 'market_research',
      tokenConsumption: 6200
    };
  } else {
    const supabase = await createClient();
    const { data: { user: dbUser } } = await supabase.auth.getUser();
    user = dbUser;

    if (!user) {
      redirect('/login');
    }

    // 1. Fetch Subscription details
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    subscription = sub || { plan_type: 'free', status: 'active' };

    // Fetch Transactions and Invoices
    const [txsData, invsData] = await Promise.all([
      supabase
        .from('billing_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    transactions = txsData.data || [];
    invoices = invsData.data || [];

    // 2. Fetch User Workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id);
    workspacesCount = workspaces?.length || 0;
    const workspaceIds = workspaces?.map(w => w.id) || [];

    if (workspaceIds.length > 0) {
      // 3. Fetch Documents
      const { data: docs } = await supabase
        .from('documents')
        .select('file_size')
        .in('workspace_id', workspaceIds);
      documentsCount = docs?.length || 0;
      documentsSize = docs?.reduce((acc, d) => acc + d.file_size, 0) || 0;

      // 4. Fetch team members seats occupied
      const { count: membersVal } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds);
      teamMembersCount = membersVal || 0;

      // 5. Fetch monthly AI generations (Jobs + Chat/Customizer events)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        { count: jobsVal },
        { count: eventsVal }
      ] = await Promise.all([
        supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .in('workspace_id', workspaceIds)
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('workspace_events')
          .select('*', { count: 'exact', head: true })
          .in('workspace_id', workspaceIds)
          .in('event_type', ['chat', 'branding', 'finance', 'marketing', 'roadmap', 'pitchdeck', 'landingpage'])
          .gte('created_at', startOfMonth.toISOString())
      ]);

      aiGenerationsCount = (jobsVal || 0) + (eventsVal || 0);

      // 6. Fetch AI Generation logs for cost intelligence
      const { data: logs } = await supabase
        .from('ai_generation_logs')
        .select('*')
        .eq('user_id', user.id);

      if (logs && logs.length > 0) {
        const totalCostSum = logs.reduce((acc, l) => acc + (parseFloat(l.cost) || 0), 0);
        const totalTokensSum = logs.reduce((acc, l) => acc + (l.prompt_tokens || 0) + (l.completion_tokens || 0), 0);
        const monthlyLogs = logs.filter(l => new Date(l.created_at) >= startOfMonth);
        const monthlyCostSum = monthlyLogs.reduce((acc, l) => acc + (parseFloat(l.cost) || 0), 0);

        // Group workflows by agent type to find the most expensive workflow category
        const costByWorkflow: Record<string, number> = {};
        logs.forEach(l => {
          if (l.agent_type) {
            costByWorkflow[l.agent_type] = (costByWorkflow[l.agent_type] || 0) + (parseFloat(l.cost) || 0);
          }
        });

        let highestCostWorkflow = 'None';
        let highestCost = -1;
        Object.entries(costByWorkflow).forEach(([workflow, cost]) => {
          if (cost > highestCost) {
            highestCost = cost;
            highestCostWorkflow = workflow;
          }
        });

        analytics = {
          totalSpend: totalCostSum,
          monthlySpend: monthlyCostSum,
          avgCostPerRun: totalCostSum / logs.length,
          mostExpensiveWorkflow: highestCostWorkflow,
          tokenConsumption: totalTokensSum
        };
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative overflow-hidden text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-slate-350 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
            </div>
            <span className="font-semibold text-slate-650 text-xs hidden sm:inline transition-colors group-hover:text-slate-900">
              Workspace Console
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
              <Shield className="w-5 h-5 text-slate-800" />
            </div>
            <span className="font-sans font-bold text-lg text-slate-900 tracking-tight">
              StartupOS <span className="text-slate-550">AI</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Billing Panel */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900">
            Billing & Usage Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track active SaaS generations metrics, audit tokens spend, and manage plans.
          </p>
        </div>

        <BillingDashboardView
          subscription={subscription}
          workspacesCount={workspacesCount}
          documentsCount={documentsCount}
          documentsSize={documentsSize}
          aiGenerationsCount={aiGenerationsCount}
          teamMembersCount={teamMembersCount}
          analytics={analytics}
          transactions={transactions}
          invoices={invoices}
        />
      </main>
    </div>
  );
}

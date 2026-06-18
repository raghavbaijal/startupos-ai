'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, Users, Building2, Cpu, ArrowLeft, 
  Mail, Coins, CheckCircle, AlertCircle, Clock,
  Search, Filter, SlidersHorizontal, Zap, ArrowRight,
  TrendingUp, Activity, FileText, Globe, Send, MessageSquare, HeartPulse, Sparkles, RefreshCw
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkspaces: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  monthlyAiSpend: number;
  totalAiRuns: number;
  totalTokenCost: number;
  billingStats: {
    free: number;
    pro: number;
    team: number;
  };
}

const MOCK_STATS: AdminStats = {
  totalUsers: 1450,
  activeUsers: 840,
  totalWorkspaces: 1840,
  activeSubscriptions: 210,
  monthlyRevenue: 8790,
  monthlyAiSpend: 169.20,
  totalAiRuns: 4230,
  totalTokenCost: 169.20,
  billingStats: {
    free: 1240,
    pro: 165,
    team: 45
  }
};

const MOCK_USERS = [
  { id: 'user-1', email: 'demo-founder@startupos.ai', full_name: 'Demo Founder', created_at: '2026-05-20T09:30:00Z', plan_type: 'free', workspace_count: 3 },
  { id: 'user-2', email: 'admin-collab@startupos.ai', full_name: 'Admin Collaborator', created_at: '2026-05-22T10:15:00Z', plan_type: 'pro', workspace_count: 2 },
  { id: 'user-3', email: 'editor-collab@startupos.ai', full_name: 'Editor Collaborator', created_at: '2026-05-25T14:40:00Z', plan_type: 'pro', workspace_count: 1 },
  { id: 'user-4', email: 'investor-group@vcpartners.com', full_name: 'VC Partner Account', created_at: '2026-06-01T12:00:00Z', plan_type: 'team', workspace_count: 4 },
  { id: 'user-5', email: 'student-rep@campus.edu', full_name: 'Campus Ambassador', created_at: '2026-06-03T16:20:00Z', plan_type: 'free', workspace_count: 0 }
];

const MOCK_WORKSPACES = [
  { id: 'demo-workspace-1', name: 'EcoThread India', industry: 'Sustainable Fashion', budget: 50000, stage: 'branding', created_at: '2026-05-20T10:00:00Z', owner_name: 'Demo Founder', owner_email: 'demo-founder@startupos.ai' },
  { id: 'demo-workspace-2', name: 'Z-Delivery', industry: 'Logistics Tech', budget: 120000, stage: 'ideation', created_at: '2026-05-24T11:00:00Z', owner_name: 'Admin Collaborator', owner_email: 'admin-collab@startupos.ai' },
  { id: 'demo-workspace-3', name: 'SmartLearn', industry: 'EdTech AI', budget: 35000, stage: 'pitchdeck', created_at: '2026-06-02T15:30:00Z', owner_name: 'Editor Collaborator', owner_email: 'editor-collab@startupos.ai' }
];

const MOCK_TICKETS = [
  {
    id: 'ticket-mock-1',
    user_id: 'mock-user-1',
    workspace_id: 'mock-ws-1',
    subject: 'Stripe Razorpay Payment Timeout',
    status: 'open',
    priority: 'high',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    user_email: 'demo-founder@startupos.ai',
    workspace_name: 'EcoThread India',
    messages: [
      { id: 'msg-1', ticket_id: 'ticket-mock-1', sender_type: 'user', message: 'Hi support team, I attempted to upgrade my plan to Pro, but Razorpay checkout timed out after OTP. Please verify my payment.', created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'ticket-mock-2',
    user_id: 'mock-user-2',
    workspace_id: 'mock-ws-2',
    subject: 'Gemini LLM Rate Limit Extension',
    status: 'pending',
    priority: 'medium',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    user_email: 'admin-collab@startupos.ai',
    workspace_name: 'Z-Delivery',
    messages: [
      { id: 'msg-2', ticket_id: 'ticket-mock-2', sender_type: 'user', message: 'I am using the system for validating multiple fashion startups on campus and hit the 10 runs limit. Can I get an increase?', created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
      { id: 'msg-3', ticket_id: 'ticket-mock-2', sender_type: 'admin', message: 'Hello! I have updated your workspace plan to Pro tier for evaluation. You now have unlimited generations.', created_at: new Date(Date.now() - 23 * 3600 * 1000).toISOString() }
    ]
  }
];

const MOCK_RELIABILITY_DATA = {
  totalRuns: 120,
  successCount: 114,
  failureCount: 6,
  successRate: 95,
  failureRate: 5,
  avgLatencyMs: 2450,
  totalCost: 0.125,
  costPerWorkflow: [
    { workflow: 'idea_generation', avgCost: 0.0021, totalCost: 0.042, count: 20 },
    { workflow: 'market_research', avgCost: 0.0035, totalCost: 0.035, count: 10 },
    { workflow: 'branding', avgCost: 0.0012, totalCost: 0.024, count: 20 },
    { workflow: 'marketing', avgCost: 0.0015, totalCost: 0.015, count: 10 },
    { workflow: 'pitch_deck', avgCost: 0.0045, totalCost: 0.009, count: 2 }
  ],
  commonFailures: [
    { message: 'API rate limit exceeded (429)', count: 4 },
    { message: 'Request timeout after 30s', count: 2 }
  ]
};

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [recruiterMode, setRecruiterMode] = useState(process.env.NODE_ENV !== 'production');
  const [realStats, setRealStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tab & Directory State
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workspaces' | 'health' | 'reliability' | 'support'>('overview');
  const [reliabilityData, setReliabilityData] = useState<any>(null);
  const [isLoadingReliability, setIsLoadingReliability] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  // Simulated live updates for directories
  const [mockUsers, setMockUsers] = useState<any[]>(MOCK_USERS);
  const [mockWorkspaces, setMockWorkspaces] = useState<any[]>(MOCK_WORKSPACES);
  const [mockTickets, setMockTickets] = useState<any[]>(MOCK_TICKETS);
  
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [realWorkspaces, setRealWorkspaces] = useState<any[]>([]);
  const [realTickets, setRealTickets] = useState<any[]>([]);
  
  // Health Metrics
  const [healthServices, setHealthServices] = useState<Record<string, string>>({
    Supabase: 'Healthy',
    OpenRouter: 'Healthy',
    Gemini: 'Healthy',
    QStash: 'Healthy'
  });
  
  // Active support ticket state
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchReliabilityData = async () => {
    setIsLoadingReliability(true);
    try {
      const { getAiReliabilityMetrics } = await import('@/app/admin-actions');
      const res = await getAiReliabilityMetrics();
      if (res.success && res.data) {
        setReliabilityData(res.data);
      }
    } catch (err) {
      console.error('Failed to load reliability metrics:', err);
    } finally {
      setIsLoadingReliability(false);
    }
  };

  const loadMetricsAndData = async (activeRecruiterMode?: boolean) => {
    const isRecMode = activeRecruiterMode !== undefined ? activeRecruiterMode : recruiterMode;
    setIsLoading(true);
    try {
      const { getAdminDashboardStats, getSystemHealthMetrics, getSupportTickets } = await import('@/app/admin-actions');
      
      const [statsRes, healthRes, ticketsRes] = await Promise.all([
        getAdminDashboardStats(),
        getSystemHealthMetrics(),
        getSupportTickets()
      ]);

      if (statsRes.success && statsRes.data) {
        setRealStats(statsRes.data);
      }
      if (healthRes.success && healthRes.data) {
        setHealthServices(healthRes.data.services);
      }
      if (ticketsRes.success && ticketsRes.data) {
        setRealTickets(ticketsRes.data);
      }
      
      // Strict admin check and fail-closed logic
      if (!statsRes.success) {
        setIsAdmin(false);
        if (process.env.NODE_ENV === 'production') {
          console.error('Unauthorized access to admin console. Redirecting...');
          window.location.href = '/';
          return;
        } else if (!isRecMode) {
          alert('Unauthorized: You do not have admin access to the live database. Switching back to Recruiter Demo Mode.');
          setRecruiterMode(true);
          document.cookie = 'recruiter_mode=true; path=/; max-age=31536000; SameSite=Lax';
        }
      } else {
        setIsAdmin(true);
      }
      await fetchReliabilityData();
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Read recruiter mode cookie on load
    let currentRecruiterMode = process.env.NODE_ENV !== 'production';
    if (process.env.NODE_ENV === 'production') {
      setRecruiterMode(false);
      document.cookie = 'recruiter_mode=false; path=/; max-age=31536000; SameSite=Lax';
      currentRecruiterMode = false;
    } else {
      const cookiesList = document.cookie.split(';');
      const recruiterCookie = cookiesList.find(c => c.trim().startsWith('recruiter_mode='));
      if (recruiterCookie) {
        const parsedMode = recruiterCookie.split('=')[1].trim() === 'true';
        setRecruiterMode(parsedMode);
        currentRecruiterMode = parsedMode;
      } else {
        document.cookie = 'recruiter_mode=true; path=/; max-age=31536000; SameSite=Lax';
        setRecruiterMode(true);
        currentRecruiterMode = true;
      }
    }
    
    loadMetricsAndData(currentRecruiterMode);
  }, []);

  // Fetch live directories when Recruiter Mode is turned off or search/tab changes
  useEffect(() => {
    if (recruiterMode) return;
    
    async function fetchRealData() {
      try {
        const { getAdminUsers, getAdminWorkspaces, getSupportTickets } = await import('@/app/admin-actions');
        const [usersRes, wsRes, ticketsRes] = await Promise.all([
          getAdminUsers(searchQuery),
          getAdminWorkspaces(searchQuery),
          getSupportTickets()
        ]);
        
        if (usersRes.success && usersRes.data) {
          setRealUsers(usersRes.data);
        }
        if (wsRes.success && wsRes.data) {
          setRealWorkspaces(wsRes.data);
        }
        if (ticketsRes.success && ticketsRes.data) {
          setRealTickets(ticketsRes.data);
        }
      } catch (e) {
        console.error('Failed to load real admin directories:', e);
      }
    }
    fetchRealData();
  }, [recruiterMode, searchQuery, activeTab]);

  const activeStats = recruiterMode ? MOCK_STATS : (realStats || MOCK_STATS);

  const activeUsers = recruiterMode 
    ? mockUsers.filter(u => {
        const matchesQuery = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             u.full_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlan = planFilter === 'all' || u.plan_type === planFilter;
        return matchesQuery && matchesPlan;
      })
    : realUsers.filter(u => {
        const matchesQuery = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesPlan = planFilter === 'all' || u.plan_type === planFilter;
        return matchesQuery && matchesPlan;
      });

  const activeWorkspacesList = recruiterMode
    ? mockWorkspaces.filter(w => {
        const matchesQuery = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             w.industry.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStage = stageFilter === 'all' || w.stage === stageFilter;
        return matchesQuery && matchesStage;
      })
    : realWorkspaces.filter(w => {
        const matchesQuery = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             w.industry.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStage = stageFilter === 'all' || w.stage === stageFilter;
        return matchesQuery && matchesStage;
      });

  const activeTicketsList = recruiterMode ? mockTickets : realTickets;

  const handleUpdatePlan = async (userId: string, newPlan: 'free' | 'pro' | 'team') => {
    if (recruiterMode) {
      setMockUsers(prev => prev.map(u => u.id === userId ? { ...u, plan_type: newPlan } : u));
      alert(`Demo Mode: Simulated user upgrade to ${newPlan.toUpperCase()} successfully.`);
    } else {
      try {
        const { updateUserPlan } = await import('@/app/admin-actions');
        const res = await updateUserPlan(userId, newPlan);
        if (res.success) {
          alert(`Success: Plan updated to ${newPlan.toUpperCase()}.`);
          // Re-fetch users & stats
          loadMetricsAndData();
        } else {
          alert(`Error: ${res.error || 'Failed to update plan'}`);
        }
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicketId) return;
    setIsSubmittingReply(true);
    try {
      if (recruiterMode) {
        setMockTickets(prev => prev.map(t => {
          if (t.id === activeTicketId) {
            return {
              ...t,
              messages: [
                ...t.messages,
                { id: `msg-${Date.now()}`, sender_type: 'admin', message: replyText, created_at: new Date().toISOString() }
              ]
            };
          }
          return t;
        }));
        setReplyText('');
      } else {
        const { replyToSupportTicket } = await import('@/app/admin-actions');
        const res = await replyToSupportTicket(activeTicketId, replyText);
        if (res.success) {
          setReplyText('');
          // Re-fetch tickets
          const { getSupportTickets } = await import('@/app/admin-actions');
          const ticketsRes = await getSupportTickets();
          if (ticketsRes.success && ticketsRes.data) {
            setRealTickets(ticketsRes.data);
          }
        } else {
          alert('Failed to send reply: ' + res.error);
        }
      }
    } catch (e: any) {
      alert('Error sending reply: ' + e.message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleChangeStatus = async (ticketId: string, newStatus: string) => {
    try {
      if (recruiterMode) {
        setMockTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      } else {
        const { replyToSupportTicket } = await import('@/app/admin-actions');
        const res = await replyToSupportTicket(ticketId, 'Status updated by admin', newStatus);
        if (res.success) {
          const { getSupportTickets } = await import('@/app/admin-actions');
          const ticketsRes = await getSupportTickets();
          if (ticketsRes.success && ticketsRes.data) {
            setRealTickets(ticketsRes.data);
          }
        } else {
          alert('Failed to update status');
        }
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-slate-900 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650"></div>
          <p className="text-sm text-slate-500 font-semibold animate-pulse">Loading operations console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-slate-900 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-slate-350 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
            </div>
            <span className="font-semibold text-slate-650 text-xs hidden sm:inline transition-colors group-hover:text-slate-900">
              Back to Landing Page
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
              <Shield className="w-5 h-5 text-indigo-655" />
            </div>
            <span className="font-sans font-bold text-lg text-slate-900 tracking-tight">
              StartupOS <span className="text-slate-550">Operations</span>
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10">
        {/* Admin Header Panel */}
        <div className="glass-panel border border-slate-200 p-8 rounded-3xl bg-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-indigo-650 font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>SaaS Control Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900">
              Operations Center
            </h1>
            <p className="text-slate-555 text-xs sm:text-sm max-w-xl">
              Monitor key metrics, subscription counts, live startup pipelines, system uptime, and customer support channels.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Tab Switching */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200 overflow-x-auto">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'users', name: 'Users' },
                { id: 'workspaces', name: 'Workspaces' },
                { id: 'health', name: 'System Health' },
                { id: 'reliability', name: 'Reliability' },
                { id: 'support', name: 'Support' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                      : 'text-slate-505 hover:text-slate-900'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Toggle Recruiter Mode Bypass */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 shrink-0">
              <div>
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Recruiter Demo Mode</p>
                <p className="text-[8px] text-slate-550">Simulated vs. Live db</p>
              </div>
              <button 
                onClick={() => {
                  const newMode = !recruiterMode;
                  setRecruiterMode(newMode);
                  document.cookie = `recruiter_mode=${newMode}; path=/; max-age=31536000; SameSite=Lax`;
                  setSearchQuery('');
                  setActiveTicketId(null);
                }}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${recruiterMode ? 'bg-indigo-650' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${recruiterMode ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Dashboard Grid - Operations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Users */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-650">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-slate-850 animate-fadeIn">
                    {activeStats.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1">+14% increase this week</p>
                </div>
              </div>

              {/* Active Users */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Active Users</span>
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-650 font-bold">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-slate-850">
                    {activeStats.activeUsers.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1">Users actively building workspaces</p>
                </div>
              </div>

              {/* Total Workspaces */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Workspaces</span>
                  <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-slate-850">
                    {activeStats.totalWorkspaces.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1">Total active startup drafts</p>
                </div>
              </div>
            </div>

            {/* SaaS Revenue & Spend Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Subscriptions */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Active Subscriptions</span>
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-650">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-slate-850">
                    {activeStats.activeSubscriptions.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1">Paying customers on Pro or Team tier</p>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Monthly Revenue</span>
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-slate-850">
                    ${activeStats.monthlyRevenue.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1">
                    Pro: ${activeStats.billingStats.pro * 29} | Team: ${activeStats.billingStats.team * 89}
                  </p>
                </div>
              </div>

              {/* Monthly AI Spend */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Monthly AI Spend</span>
                  <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-heading text-slate-850">
                    ${activeStats.monthlyAiSpend.toFixed(2)}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-1">LLM token cost (last 30 days)</p>
                </div>
              </div>
            </div>

            {/* Plan tier breakdown */}
            <div className="glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-slate-800">SaaS Plan Distribution</h3>
                <p className="text-slate-500 text-xs mt-0.5">Distribution of user accounts across the payment tiers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Free Plan', count: activeStats.billingStats.free, color: 'bg-slate-105 text-slate-700 border-slate-200' },
                  { label: 'Pro Plan ($29/mo)', count: activeStats.billingStats.pro, color: 'bg-indigo-50/50 text-indigo-700 border-indigo-200' },
                  { label: 'Team Plan ($89/mo)', count: activeStats.billingStats.team, color: 'bg-emerald-50/50 text-emerald-700 border-emerald-200' }
                ].map((tier, idx) => (
                  <div key={idx} className={`p-5 border rounded-2xl flex flex-col justify-between h-28 ${tier.color}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">{tier.label}</span>
                    <span className="text-3xl font-bold font-heading">{tier.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Search & Filters */}
            <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 items-center w-full md:w-auto shrink-0 justify-end">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Plan Tiers</option>
                  <option value="free">Free Tier</option>
                  <option value="pro">Pro Tier</option>
                  <option value="team">Team Tier</option>
                </select>
                
                <span className="text-xs text-slate-500 font-bold uppercase">
                  Count: {activeUsers.length}
                </span>
              </div>
            </div>

            {/* Users Directory Table */}
            <div className="glass-panel border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Email / Account Details</th>
                      <th className="py-4 px-6">Signup Date</th>
                      <th className="py-4 px-6">Current Plan</th>
                      <th className="py-4 px-6">Workspace Count</th>
                      <th className="py-4 px-6 w-44 text-right">Manage Plan Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-slate-500 italic">
                          No users matched search criteria.
                        </td>
                      </tr>
                    ) : (
                      activeUsers.map((u) => (
                        <tr key={u.id} className="text-slate-700 text-xs hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-650 uppercase shrink-0">
                                {u.email ? u.email[0] : 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{u.full_name || 'Beta User'}</p>
                                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-600">
                            {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              u.plan_type === 'team'
                                ? 'bg-emerald-50 border-emerald-250 text-emerald-750'
                                : u.plan_type === 'pro'
                                ? 'bg-indigo-50 border-indigo-250 text-indigo-750'
                                : 'bg-slate-100 border-slate-200 text-slate-605'
                            }`}>
                              {u.plan_type}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-850">
                            {u.workspace_count} workspaces
                          </td>
                          <td className="py-4 px-6 text-right">
                            <select
                              value={u.plan_type}
                              onChange={(e) => handleUpdatePlan(u.id, e.target.value as any)}
                              className="px-2.5 py-1 border border-slate-200 bg-white hover:border-indigo-500 rounded-lg text-[10px] font-bold text-slate-705 focus:outline-none cursor-pointer focus:border-indigo-500"
                            >
                              <option value="free">Free Tier</option>
                              <option value="pro">Pro Plan ($29/mo)</option>
                              <option value="team">Team Plan ($89/mo)</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: WORKSPACES */}
        {activeTab === 'workspaces' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Search & Filters */}
            <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search workspace details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 items-center w-full md:w-auto shrink-0 justify-end">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Launch Stages</option>
                  <option value="ideation">Ideation Stage</option>
                  <option value="branding">Branding Stage</option>
                  <option value="roadmap">Roadmap Stage</option>
                  <option value="pitchdeck">Pitch Deck Stage</option>
                  <option value="marketing">Marketing Stage</option>
                </select>

                <span className="text-xs text-slate-500 font-bold uppercase">
                  Count: {activeWorkspacesList.length}
                </span>
              </div>
            </div>

            {/* Workspaces Directory Table */}
            <div className="glass-panel border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Startup Name</th>
                      <th className="py-4 px-6">Industry Cluster</th>
                      <th className="py-4 px-6">Pipeline Stage</th>
                      <th className="py-4 px-6">Owner Account</th>
                      <th className="py-4 px-6 text-right">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeWorkspacesList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-slate-500 italic">
                          No workspaces matched filters.
                        </td>
                      </tr>
                    ) : (
                      activeWorkspacesList.map((w) => (
                        <tr key={w.id} className="text-slate-700 text-xs hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-bold text-slate-800">{w.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5 text-slate-400" /> Budget: ₹{parseFloat(w.budget).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded-full font-semibold text-slate-600">
                              {w.industry}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">
                              {w.stage}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-bold text-slate-800">{w.owner_name}</p>
                              <p className="text-[10px] text-slate-500">{w.owner_email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-550">
                            {new Date(w.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: SYSTEM HEALTH */}
        {activeTab === 'health' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-850">Uptime & Service Health</h3>
                <p className="text-slate-500 text-xs mt-0.5">Check status and latency checks of our core cloud endpoints.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Object.entries(healthServices).map(([service, status]) => (
                  <div
                    key={service}
                    className={`p-6 border rounded-2xl flex flex-col justify-between h-32 transition-all shadow-sm ${
                      status === 'Healthy'
                        ? 'border-emerald-250 bg-emerald-50/20 text-emerald-800'
                        : status === 'Warning'
                        ? 'border-amber-250 bg-amber-50/20 text-amber-800'
                        : 'border-rose-250 bg-rose-50/20 text-rose-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold uppercase tracking-wider">{service}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'Healthy' ? 'bg-emerald-500 animate-ping' : status === 'Warning' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-heading">{status}</p>
                      <p className="text-[10px] opacity-75 mt-0.5">Uptime: {status === 'Healthy' ? '99.98%' : 'Degraded'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simple queue health metric */}
            <div className="glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-650" /> Background Worker Queue
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-55 text-emerald-700 border border-emerald-100 rounded uppercase">
                  Queue Active
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-slate-450 uppercase">Jobs Pending</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">0</p>
                </div>
                <div className="p-4 bg-emerald-50/10 border border-emerald-100 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase">Jobs Completed</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">45</p>
                </div>
                <div className="p-4 bg-rose-50/10 border border-rose-100 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-rose-600 uppercase">Jobs Failed</p>
                  <p className="text-xl font-bold text-rose-700 mt-1">1</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: RELIABILITY DASHBOARD */}
        {activeTab === 'reliability' && (
          <div className="space-y-8 animate-fadeIn">
            {/* 1. Core KPIs */}
            {(() => {
              const metrics = reliabilityData || MOCK_RELIABILITY_DATA;
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Success Rate */}
                    <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Success Rate</span>
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-extrabold font-heading text-emerald-600">{metrics.successRate}%</p>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                          <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${metrics.successRate}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1.5 font-medium">{metrics.successCount} of {metrics.totalRuns} requests completed successfully.</p>
                      </div>
                    </div>

                    {/* Failure Rate */}
                    <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Failure Rate</span>
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-extrabold font-heading text-rose-600">{metrics.failureRate}%</p>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                          <div className="bg-rose-500 h-1.5 rounded-full transition-all" style={{ width: `${metrics.failureRate}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1.5 font-medium">{metrics.failureCount} generations failed or were intercepted.</p>
                      </div>
                    </div>

                    {/* Avg Latency */}
                    <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Avg Latency</span>
                        <Clock className="w-5 h-5 text-indigo-550" />
                      </div>
                      <div>
                        <p className="text-3xl font-extrabold font-heading text-slate-800">{(metrics.avgLatencyMs / 1000).toFixed(2)}s</p>
                        <p className="text-[9px] text-slate-400 mt-3 font-medium">Average generation and pipeline response time.</p>
                      </div>
                    </div>

                    {/* Total Spend */}
                    <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">AI API Cost</span>
                        <Coins className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-extrabold font-heading text-slate-800">${metrics.totalCost.toFixed(5)}</p>
                        <p className="text-[9px] text-slate-400 mt-3 font-medium">Accumulated token spend across all workflows.</p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Detailed Workflows & Common Failures */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
                    {/* Cost per Workflow */}
                    <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Workflow Spend & Frequency</h3>
                        <p className="text-slate-500 text-[10px] mt-0.5">Average costs and runs grouped by generative agent type.</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead>
                            <tr className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                              <th className="py-2.5">Workflow / Agent</th>
                              <th className="py-2.5 text-center">Runs</th>
                              <th className="py-2.5 text-right">Avg Cost</th>
                              <th className="py-2.5 text-right">Total Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {metrics.costPerWorkflow.map((w: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/55 transition-colors">
                                <td className="py-3 font-semibold text-slate-850 uppercase tracking-tight text-[10px]">{w.workflow.replace(/_/g, ' ')}</td>
                                <td className="py-3 text-center font-bold text-slate-650">{w.count}</td>
                                <td className="py-3 text-right font-mono text-slate-600">${w.avgCost.toFixed(6)}</td>
                                <td className="py-3 text-right font-mono font-bold text-slate-900">${w.totalCost.toFixed(5)}</td>
                              </tr>
                            ))}
                            {metrics.costPerWorkflow.length === 0 && (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-slate-400 italic">No workflow logs available.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Common Failures Audit */}
                    <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Common Failures Audit</h3>
                        <p className="text-slate-500 text-[10px] mt-0.5">Scrubbed error messages and occurrence frequencies.</p>
                      </div>

                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {metrics.commonFailures.map((f: any, idx: number) => (
                          <div key={idx} className="p-4 bg-rose-50/20 border border-rose-100 rounded-2xl flex items-start justify-between gap-3 hover:bg-rose-50/40 transition-colors">
                            <div className="space-y-1 min-w-0 flex-1">
                              <span className="px-2 py-0.5 bg-rose-100/50 text-rose-700 border border-rose-100 rounded text-[8px] font-bold uppercase tracking-wider">
                                Error Log
                              </span>
                              <p className="text-[11px] text-rose-900 leading-relaxed font-semibold font-mono break-words">{f.message}</p>
                            </div>
                            <span className="text-xs font-extrabold text-rose-800 bg-rose-100 px-2 py-1 rounded-xl shrink-0">
                              {f.count}x
                            </span>
                          </div>
                        ))}
                        {metrics.commonFailures.length === 0 && (
                          <div className="py-12 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-slate-100">
                            No service failures logged. Uptime remains 100%.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Tab Content: SUPPORT CONSOLE */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full animate-fadeIn">
            {/* Left Column: Tickets Queue (5 cols) */}
            <div className="lg:col-span-5 space-y-6 w-full">
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-650" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tickets Queue</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Count: {activeTicketsList.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {activeTicketsList.length === 0 ? (
                    <p className="text-xs text-slate-455 italic text-center py-8">No tickets submitted.</p>
                  ) : (
                    activeTicketsList.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          setActiveTicketId(ticket.id);
                        }}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                          activeTicketId === ticket.id
                            ? 'border-indigo-500 bg-indigo-50/20'
                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-850 line-clamp-1">{ticket.subject}</h4>
                            <p className="text-[9px] text-slate-500 mt-0.5">From: {ticket.user_email || 'unknown'}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${
                            ticket.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : ticket.status === 'pending'
                              ? 'bg-amber-55 text-amber-700 border border-amber-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-3 text-[9px] text-slate-450 font-semibold">
                          <span className="flex items-center gap-1">
                            Priority: <span className="font-extrabold text-slate-700 uppercase">{ticket.priority}</span>
                          </span>
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Ticket Details & History (7 cols) */}
            <div className="lg:col-span-7 w-full">
              {activeTicketId ? (
                (() => {
                  const activeTicket = activeTicketsList.find(t => t.id === activeTicketId);
                  if (!activeTicket) return null;
                  return (
                    <div className="glass-panel border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-sm flex flex-col h-[585px]">
                      {/* Ticket Header & Status Changer */}
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-850 line-clamp-1">{activeTicket.subject}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Email: {activeTicket.user_email || 'founder-eco@clothing.in'}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-550 uppercase">Status:</span>
                          <select
                            value={activeTicket.status}
                            onChange={(e) => handleChangeStatus(activeTicket.id, e.target.value)}
                            className="px-2.5 py-1 border border-slate-200 bg-white rounded-lg text-[9px] font-bold text-slate-700 focus:outline-none cursor-pointer focus:border-indigo-500"
                          >
                            <option value="open">Open</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
                      </div>

                      {/* Conversation Log */}
                      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/10">
                        {activeTicket.messages?.map((msg: any) => {
                          const isAdmin = msg.sender_type === 'admin';
                          return (
                            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm text-xs ${
                                isAdmin
                                  ? 'bg-slate-900 text-white rounded-tr-none'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}>
                                <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold uppercase opacity-75">
                                  <span>{isAdmin ? 'You (Support)' : 'Founder'}</span>
                                  <span>•</span>
                                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Response Composer */}
                      {activeTicket.status !== 'resolved' ? (
                        <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-white flex gap-3 items-center">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type response to founder..."
                            className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingReply || !replyText.trim()}
                            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl disabled:opacity-50 transition-colors"
                          >
                            {isSubmittingReply ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </form>
                      ) : (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center text-xs text-slate-500 font-semibold italic">
                          This support ticket has been closed and marked as resolved.
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="glass-panel border border-slate-200 rounded-3xl bg-white h-[585px] flex flex-col items-center justify-center text-center p-8">
                  <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-650 mb-4">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Select a Support Ticket</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Select a ticket from the left queue to inspect details, view response history, update status, and type replies directly to the founder.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import UpgradeModal from '@/components/UpgradeModal';
import InlineCommentsWidget from '@/components/InlineCommentsWidget';
import { 
  deleteWorkspace, 
  generateCustomNames, 
  generateCustomTaglines, 
  generateCustomPalette, 
  generateCustomLogoPrompts, 
  saveBrandProfile,
  generateCustomRoadmap,
  saveWorkspaceRoadmap,
  generateCustomMarketing,
  saveWorkspaceMarketing,
  generateCustomFinance,
  saveWorkspaceFinance,
  generateCustomPitchDeck,
  saveWorkspacePitchDeck,
  generateCustomLandingPage,
  saveWorkspaceLandingPage,
  getWorkspaceTimeline,
  getWorkspaceHealthScore,
  queryKnowledgeAssistant,
  inviteMember,
  revokeInvitation,
  addComment,
  deleteComment,
  createVersion,
  rollbackToVersion
} from '@/app/workspace-actions';
import { 
  Building2, Trash2, Calendar, Target, IndianRupee, BarChart3, Palette, 
  Milestone, Megaphone, Copy, Check, Shield, ExternalLink, HelpCircle, AlertTriangle,
  Sparkles, RefreshCw, Sliders, Plus, Trash, CheckSquare, Square,
  Presentation, ChevronLeft, ChevronRight, Download, Globe, ChevronDown, ArrowRight, Star, Leaf, Zap, Users, Menu, X,
  BookOpen, History, Activity, UploadCloud, Search, FileText, Send, File, MessageSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function safeParseProjections(arr: any): number[] {
  const result = Array(12).fill(0);
  if (!arr || !Array.isArray(arr)) return result;
  for (let i = 0; i < 12; i++) {
    const val = arr[i];
    if (val === undefined || val === null) {
      result[i] = 0;
    } else if (typeof val === 'number') {
      result[i] = isNaN(val) ? 0 : val;
    } else if (typeof val === 'object' && val !== null) {
      const costVal = parseFloat(val.cost);
      result[i] = isNaN(costVal) ? 0 : costVal;
    } else {
      const parsed = parseFloat(val);
      result[i] = isNaN(parsed) ? 0 : parsed;
    }
  }
  return result;
}

interface WorkspaceDashboardViewProps {
  workspace: any;
  report: any;
  branding: any;
  finance: any;
  roadmap: any;
  marketing: any;
  competitors?: any[];
  pitchDeck?: any;
  landingPage?: any;
  members?: any[];
  invitations?: any[];
  comments?: any[];
  versions?: any[];
  documents?: any[];
  isReadOnly?: boolean;
  userRole?: 'owner' | 'admin' | 'editor' | 'viewer';
  planType?: 'free' | 'pro' | 'team';
  generationCount?: number;
  generationLimit?: number;
  currentUserProfile?: {
    id?: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

const DEMO_TOUR_STEPS = [
  {
    step: 1,
    title: "Welcome to StartupOS AI Demo 🚀",
    desc: "StartupOS AI is a multi-agent operating system that helps founders launch ventures with persistent AI memory and team collaboration. Let's take a 3-minute guided tour of our sustainable apparel startup, EcoThread India.",
    tab: "overview" as const,
    targetId: "tour-step-header"
  },
  {
    step: 2,
    title: "Startup Readiness Score 📈",
    desc: "Our signature feature combines SWOT analysis, branding assets, financial forecasts, and knowledge base completeness into a single composite score (0-100%) to rate venture feasibility.",
    tab: "overview" as const,
    targetId: "tour-step-readiness-gauge"
  },
  {
    step: 3,
    title: "Startup Validation & SWOT 🛡️",
    desc: "Co-founder agents conduct rigorous market research, mapping SWOT analytics, risk mitigation parameters, and differentiation strategies to evaluate viability.",
    tab: "research" as const,
    targetId: "tour-step-validation"
  },
  {
    step: 4,
    title: "Competitor Research 🔍",
    desc: "Track direct competitors, analyze estimated pricing tiers, log their market share, and define local competitive advantages.",
    tab: "research" as const,
    targetId: "tour-step-competitors"
  },
  {
    step: 5,
    title: "Branding Studio 🎨",
    desc: "Review selected brand name justifications, taglines, positioning statements, color hex palettes, and Midjourney/DALL-E logo prompts.",
    tab: "branding" as const,
    targetId: "tour-step-branding"
  },
  {
    step: 6,
    title: "Marketing Engine 📣",
    desc: "Inspect content publishing calendars, automated Instagram/LinkedIn copy, Google Ad search copies, and client welcoming email sequences.",
    tab: "marketing" as const,
    targetId: "tour-step-marketing"
  },
  {
    step: 7,
    title: "Financial Forecasting 💰",
    desc: "Examine detailed overheads, break-even unit sales calculations, setup expenses, and interactive 12-month cash flow charts.",
    tab: "finance" as const,
    targetId: "tour-step-finance"
  },
  {
    step: 8,
    title: "Knowledge Base & RAG Assistant 📚",
    desc: "Ingest surveys or supply contracts. Query the AI co-founder chatbot, which references the vector database for grounded answers.",
    tab: "documents" as const,
    targetId: "tour-step-knowledge-content"
  },
  {
    step: 9,
    title: "Team Collaboration & Versions 👥",
    desc: "Assign membership roles (Owner, Admin, Editor, Viewer), write inline feedback comments, and view snapshot versions history for rollbacks.",
    tab: "team" as const,
    targetId: "tour-step-team-content"
  },
  {
    step: 10,
    title: "Tour Complete! 🎉",
    desc: "You have explored StartupOS AI. Ready to build your own venture? Create your free account to launch with your own co-founder agents.",
    tab: "overview" as const,
    targetId: "tour-step-header"
  }
];

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().substring(0, 2).toUpperCase();
  }
  return 'U';
}

export default function WorkspaceDashboardView({
  workspace,
  report,
  branding,
  finance,
  roadmap,
  marketing,
  competitors = [],
  pitchDeck,
  landingPage,
  members = [],
  invitations = [],
  comments = [],
  versions = [],
  documents = [],
  isReadOnly = false,
  userRole = 'editor',
  planType = 'free',
  generationCount = 0,
  generationLimit = 10,
  currentUserProfile,
}: WorkspaceDashboardViewProps) {
  const disableEdits = isReadOnly || userRole === 'viewer';
  const isGenerationBlocked = planType === 'free' && generationCount >= generationLimit;
  const [activeTab, setActiveTab] = useState<any>('overview');

  // Support & Help Ticketing System states
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [selectedUserTicketId, setSelectedUserTicketId] = useState<string | null>(null);
  const [userTicketSubject, setUserTicketSubject] = useState('');
  const [userTicketMessage, setUserTicketMessage] = useState('');
  const [userTicketPriority, setUserTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [userTicketReplyText, setUserTicketReplyText] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isSubmittingUserReply, setIsSubmittingUserReply] = useState(false);

  const loadUserTickets = async () => {
    try {
      const { getSupportTickets } = await import('@/app/admin-actions');
      const res = await getSupportTickets();
      if (res.success && res.data) {
        const userId = currentUserProfile?.id || 'mock-user-1';
        const filtered = res.data.filter((t: any) => t.user_id === userId);
        setUserTickets(filtered);
      }
    } catch (e) {
      console.error('Failed to load user support tickets:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'support') {
      loadUserTickets();
    }
  }, [activeTab]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userTicketSubject.trim() || !userTicketMessage.trim()) return;
    setIsCreatingTicket(true);
    try {
      const { createSupportTicket } = await import('@/app/admin-actions');
      const res = await createSupportTicket(
        userTicketSubject,
        userTicketMessage,
        workspace.id,
        currentUserProfile?.email || 'demo-founder@startupos.ai'
      );
      if (res.success) {
        setUserTicketSubject('');
        setUserTicketMessage('');
        setUserTicketPriority('medium');
        await loadUserTickets();
        if (res.data) {
          setSelectedUserTicketId(res.data.id);
        }
      } else {
        alert('Failed to submit ticket');
      }
    } catch (err: any) {
      alert('Error creating support ticket: ' + err.message);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleSendUserReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userTicketReplyText.trim() || !selectedUserTicketId) return;
    setIsSubmittingUserReply(true);
    try {
      const { replyToSupportTicket } = await import('@/app/admin-actions');
      const res = await replyToSupportTicket(selectedUserTicketId, userTicketReplyText, 'open');
      if (res.success) {
        setUserTicketReplyText('');
        await loadUserTickets();
      } else {
        alert('Failed to send reply');
      }
    } catch (err: any) {
      alert('Error sending reply: ' + err.message);
    } finally {
      setIsSubmittingUserReply(false);
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isTabletOpen, setIsTabletOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('startupos-sidebar-collapsed');
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true');
      }
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('startupos-sidebar-collapsed', String(next));
      }
      return next;
    });
  };
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    Strategy: true,
    Growth: true,
    Finance: true,
    Launch: true,
    Knowledge: true,
    Team: true
  });

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const navGroups: any[] = [
    {
      name: '',
      items: [
        { id: 'overview', name: 'Overview', icon: Building2, action: () => { setActiveTab('overview'); } }
      ]
    },
    {
      name: 'Strategy',
      items: [
        { id: 'validation', name: 'Validation', icon: Shield, action: () => { setActiveTab('research'); } },
        { id: 'competitors', name: 'Competitors', icon: ExternalLink, action: () => { setActiveTab('competitors'); } }
      ]
    },
    {
      name: 'Growth',
      items: [
        { id: 'branding', name: 'Branding', icon: Palette, action: () => { setActiveTab('branding'); } },
        { id: 'marketing', name: 'Marketing', icon: Megaphone, action: () => { setActiveTab('marketing'); } }
      ]
    },
    {
      name: 'Finance',
      items: [
        { id: 'finance', name: 'Forecasting', icon: IndianRupee, action: () => { setActiveTab('finance'); } }
      ]
    },
    {
      name: 'Launch',
      items: [
        { id: 'landingpage', name: 'Landing Page', icon: Globe, action: () => { setActiveTab('landingpage'); } },
        { id: 'pitchdeck', name: 'Pitch Deck', icon: Presentation, action: () => { setActiveTab('pitchdeck'); } }
      ]
    },
    {
      name: 'Knowledge',
      items: [
        { id: 'documents', name: 'Documents', icon: BookOpen, action: () => { setActiveTab('documents'); } },
        { id: 'memory', name: 'AI Memory', icon: History, action: () => { setActiveTab('memory'); } }
      ]
    },
    {
      name: 'Team',
      items: [
        { id: 'team-members', name: 'Members & Invites', icon: Users, action: () => { setActiveTab('team'); setCollabSubTab('members'); } },
        { id: 'team-discussions', name: 'Discussions', icon: MessageSquare, action: () => { setActiveTab('team'); setCollabSubTab('discussions'); } },
        { id: 'team-versions', name: 'Version Control', icon: History, action: () => { setActiveTab('team'); setCollabSubTab('versions'); } },
        { id: 'team-timeline', name: 'Timeline & Audits', icon: Activity, action: () => { setActiveTab('team'); setCollabSubTab('timeline'); } }
      ]
    },
    {
      name: '',
      items: [
        { id: 'settings', name: 'Workspace Settings', icon: Sliders, action: () => { setActiveTab('settings'); } },
        { id: 'support', name: 'Support & Help', icon: HelpCircle, action: () => { setActiveTab('support'); } }
      ]
    }
  ];

  const getResourceType = (tab: string) => {
    switch (tab) {
      case 'research':
      case 'validation':
      case 'competitors':
        return 'report';
      case 'branding':
        return 'branding';
      case 'finance':
        return 'finance';
      case 'marketing':
        return 'marketing';
      case 'landingpage':
        return 'landingpage';
      case 'pitchdeck':
        return 'pitchdeck';
      case 'roadmap':
        return 'roadmap';
      default:
        return 'report';
    }
  };
  const currentResourceType = getResourceType(activeTab);

  // --- Upgrade Modal States ---
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeModalTitle, setUpgradeModalTitle] = useState('Upgrade to continue');
  const [upgradeModalMessage, setUpgradeModalMessage] = useState('');
  const [upgradeModalLimitType, setUpgradeModalLimitType] = useState<'workspace' | 'document' | 'generation' | 'collaboration' | 'general'>('general');

  const handleActionError = (errorMsg: string, defaultTitle = "Upgrade to continue") => {
    const lower = errorMsg.toLowerCase();
    if (lower.includes('limit') || lower.includes('upgrade') || lower.includes('tier') || lower.includes('restricted') || lower.includes('seat') || lower.includes('free tier')) {
      let limitType: any = 'general';
      if (lower.includes('workspace')) limitType = 'workspace';
      else if (lower.includes('document') || lower.includes('file')) limitType = 'document';
      else if (lower.includes('generation') || lower.includes('pipeline')) limitType = 'generation';
      else if (lower.includes('collaboration') || lower.includes('invite') || lower.includes('comment') || lower.includes('version')) limitType = 'collaboration';

      setUpgradeModalTitle(defaultTitle);
      setUpgradeModalMessage(errorMsg);
      setUpgradeModalLimitType(limitType);
      setIsUpgradeModalOpen(true);
      return true;
    }
    return false;
  };

  // --- Knowledge Base & RAG Chat States ---
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [isDocUploading, setIsDocUploading] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatSources, setChatSources] = useState<string[]>([]);

  // --- Memory Engine & Timeline States ---
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string>('');
  const [roadmapError, setRoadmapError] = useState<string>('');
  const [landingPageError, setLandingPageError] = useState<string>('');
  const [pitchDeckError, setPitchDeckError] = useState<string>('');
  const [financeError, setFinanceError] = useState<string>('');
  const [marketingError, setMarketingError] = useState<string>('');
  const [brandingError, setBrandingError] = useState<string>('');

  const [namesError, setNamesError] = useState<string>('');
  const [taglinesError, setTaglinesError] = useState<string>('');
  const [paletteError, setPaletteError] = useState<string>('');
  const [logoPromptsError, setLogoPromptsError] = useState<string>('');

  const [namesLogId, setNamesLogId] = useState<string>('');
  const [taglinesLogId, setTaglinesLogId] = useState<string>('');
  const [paletteLogId, setPaletteLogId] = useState<string>('');
  const [logoPromptsLogId, setLogoPromptsLogId] = useState<string>('');
  const [roadmapLogId, setRoadmapLogId] = useState<string>('');
  const [marketingLogId, setMarketingLogId] = useState<string>('');
  const [financeLogId, setFinanceLogId] = useState<string>('');
  const [pitchDeckLogId, setPitchDeckLogId] = useState<string>('');
  const [landingPageLogId, setLandingPageLogId] = useState<string>('');
  const [searchLogId, setSearchLogId] = useState<string>('');
  const [knowledgeLogId, setKnowledgeLogId] = useState<string>('');
  const [knowledgeError, setKnowledgeError] = useState<string>('');

  const [circuitBreakerActive, setCircuitBreakerActive] = useState<boolean>(false);

  const renderAiErrorAlert = (
    error: string,
    logId: string,
    onRetry: () => void,
    clearError: () => void
  ) => {
    if (!error) return null;
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-800 text-xs mt-3">
        <div className="flex items-start gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold text-rose-900">AI workflow encountered an issue</p>
            <p className="mt-0.5 leading-relaxed">{error}</p>
            {logId && (
              <p className="mt-1 font-mono text-[10px] text-rose-600">
                Reference ID: {logId}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={onRetry}
            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-all shrink-0"
          >
            Retry
          </button>
          <button
            onClick={() => {
              setActiveTab('support');
              setUserTicketSubject(`AI Error: ${logId}`);
              setUserTicketMessage(`Hi support, I encountered an AI error with Reference ID ${logId}. Message: ${error}`);
            }}
            className="px-2.5 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg font-bold transition-all shrink-0"
          >
            Contact Support
          </button>
          <button
            onClick={clearError}
            className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-500 transition-all shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // --- Venture Health States ---
  const [healthScoreData, setHealthScoreData] = useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  // --- Guided Tour States ---
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [demoTourStep, setDemoTourStep] = useState<number | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const isOnboarding = searchParams?.get('onboarding') === 'true';
    const hasCompletedTour = localStorage.getItem(`tour-completed-${workspace.id}`);
    if (isOnboarding && !hasCompletedTour) {
      setTourStep(1);
    }
  }, [searchParams, workspace.id]);

  useEffect(() => {
    if (isReadOnly) {
      setDemoTourStep(1);
    }
  }, [isReadOnly]);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      const intercepted = handleActionError(message);
      if (!intercepted) {
        originalAlert(message);
      }
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    if (tourStep === null) {
      document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight', 'ring-4', 'ring-emerald-500', 'ring-offset-2'));
      return;
    }

    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight', 'ring-4', 'ring-emerald-500', 'ring-offset-2'));

    let targetId = '';
    if (tourStep === 1) targetId = 'tour-step-readiness-gauge';
    if (tourStep === 2) targetId = 'tour-step-sidebar';
    if (tourStep === 3) targetId = 'tour-step-knowledge';
    if (tourStep === 4) targetId = 'tour-step-team';

    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.classList.add('tour-highlight', 'ring-4', 'ring-emerald-500', 'ring-offset-2');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [tourStep]);

  useEffect(() => {
    if (demoTourStep === null) {
      document.querySelectorAll('.demo-tour-highlight').forEach(el => el.classList.remove('demo-tour-highlight', 'ring-4', 'ring-indigo-500', 'ring-offset-2'));
      return;
    }

    document.querySelectorAll('.demo-tour-highlight').forEach(el => el.classList.remove('demo-tour-highlight', 'ring-4', 'ring-indigo-500', 'ring-offset-2'));

    const stepInfo = DEMO_TOUR_STEPS[demoTourStep - 1];
    if (stepInfo) {
      if (stepInfo.tab && activeTab !== stepInfo.tab) {
        setActiveTab(stepInfo.tab);
      }
      
      const timer = setTimeout(() => {
        if (stepInfo.targetId) {
          const el = document.getElementById(stepInfo.targetId);
          if (el) {
            el.classList.add('demo-tour-highlight', 'ring-4', 'ring-indigo-500', 'ring-offset-2');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [demoTourStep, activeTab]);

  // --- Team Collaboration States ---
  const [teamMembers, setTeamMembers] = useState<any[]>(members);
  const [pendingInvites, setPendingInvites] = useState<any[]>(invitations);
  const [commentsList, setCommentsList] = useState<any[]>(comments);
  const [versionsList, setVersionsList] = useState<any[]>(versions);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteUrlResult, setInviteUrlResult] = useState('');

  const [newCommentText, setNewCommentText] = useState('');
  const [commentResource, setCommentResource] = useState<'report' | 'branding' | 'finance' | 'roadmap' | 'marketing' | 'pitchdeck' | 'landingpage'>('report');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [versionType, setVersionType] = useState<'branding' | 'marketing' | 'finance'>('branding');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [collabSubTab, setCollabSubTab] = useState<'members' | 'versions' | 'discussions' | 'timeline'>('members');
  const [versionTypeFilter, setVersionTypeFilter] = useState<'all' | 'branding' | 'marketing' | 'finance'>('all');

  useEffect(() => { setTeamMembers(members); }, [members]);
  useEffect(() => { setPendingInvites(invitations); }, [invitations]);
  useEffect(() => { setCommentsList(comments); }, [comments]);
  useEffect(() => { setVersionsList(versions); }, [versions]);

  // --- Team Collaboration Handlers ---
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    if (isReadOnly) {
      alert("Demo Mode: Inviting team members is restricted in the public read-only Demo Workspace.");
      return;
    }
    setIsInviting(true);
    setInviteUrlResult('');
    try {
      const res = await inviteMember(workspace.id, inviteEmail, inviteRole);
      if (res.success) {
        setInviteUrlResult(res.inviteUrl || '');
        // Optimistically add to invitations list
        const newInvite = {
          id: Math.random().toString(),
          email: inviteEmail.toLowerCase().trim(),
          role: inviteRole,
          status: 'pending',
          expires_at: new Date(Date.now() + 3600000 * 24 * 7).toISOString()
        };
        setPendingInvites((prev) => [...prev, newInvite]);
        setInviteEmail('');
      } else {
        alert(res.error || 'Failed to invite member.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error occurred during invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvitation = async (inviteId: string) => {
    if (isReadOnly) {
      alert("Demo Mode: Revoking invitations is restricted in the public read-only Demo Workspace.");
      return;
    }
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      const res = await revokeInvitation(workspace.id, inviteId);
      if (res.success) {
        setPendingInvites((prev) => prev.map((inv) => inv.id === inviteId ? { ...inv, status: 'revoked' } : inv));
      } else {
        alert(res.error || 'Failed to revoke invitation.');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    if (isReadOnly) {
      alert("Demo Mode: Posting comments is restricted in the public read-only Demo Workspace.");
      return;
    }
    setIsAddingComment(true);
    try {
      const res = await addComment(workspace.id, commentResource, newCommentText);
      if (res.success && res.data) {
        setCommentsList((prev) => [...prev, res.data]);
        setNewCommentText('');
      } else {
        alert(res.error || 'Failed to add comment.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error saving comment.');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (isReadOnly) {
      alert("Demo Mode: Deleting comments is restricted in the public read-only Demo Workspace.");
      return;
    }
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await deleteComment(commentId, workspace.id);
      if (res.success) {
        setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert(res.error || 'Failed to delete comment.');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddInlineComment = async (resourceType: string, text: string): Promise<boolean> => {
    if (isReadOnly) {
      alert("Demo Mode: Posting comments is restricted in the public read-only Demo Workspace.");
      return false;
    }
    try {
      const res = await addComment(workspace.id, resourceType as any, text);
      if (res.success && res.data) {
        setCommentsList((prev) => [...prev, res.data]);
        return true;
      } else {
        alert(res.error || 'Failed to add comment.');
        return false;
      }
    } catch (err: any) {
      console.error(err);
      alert('Error saving comment.');
      return false;
    }
  };

  const handleDeleteInlineComment = async (commentId: string): Promise<boolean> => {
    if (isReadOnly) {
      alert("Demo Mode: Deleting comments is restricted in the public read-only Demo Workspace.");
      return false;
    }
    if (!confirm('Are you sure you want to delete this comment?')) return false;
    try {
      const res = await deleteComment(commentId, workspace.id);
      if (res.success) {
        setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
        return true;
      } else {
        alert(res.error || 'Failed to delete comment.');
        return false;
      }
    } catch (err: any) {
      console.error(err);
      return false;
    }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionLabel.trim()) return;
    if (isReadOnly) {
      alert("Demo Mode: Creating version snapshot checkpoints is restricted in the public read-only Demo Workspace.");
      return;
    }
    setIsCreatingVersion(true);
    try {
      const res = await createVersion(workspace.id, versionType, newVersionLabel);
      if (res.success) {
        alert(res.message || 'Version checkpoint created successfully.');
        setNewVersionLabel('');
        window.location.reload();
      } else {
        alert(res.error || 'Failed to create version checkpoint.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error creating version.');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (isReadOnly) {
      alert("Demo Mode: Rolling back versions is restricted in the public read-only Demo Workspace.");
      return;
    }
    if (!confirm('Are you sure you want to rollback to this version? A backup of your current workspace assets will be automatically created first.')) return;
    try {
      const res = await rollbackToVersion(versionId, workspace.id);
      if (res.success) {
        alert(res.message || 'Successfully rolled back to version.');
        window.location.reload();
      } else {
        alert(res.error || 'Failed to rollback version.');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // --- Knowledge Base & Document Fetching Handlers ---
  const fetchDocuments = useCallback(async () => {
    if (isReadOnly) {
      setUploadedDocs([
        { id: '1', name: 'Gen-Z Campus Merch Plan.pdf', file_size: 45200, mime_type: 'application/pdf', created_at: new Date().toISOString() },
        { id: '2', name: 'Chennai textile supplier directory.txt', file_size: 15300, mime_type: 'text/plain', created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
      setIsLoadingDocs(false);
      return;
    }
    setIsLoadingDocs(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/documents`);
      const data = await res.json();
      if (data.data) {
        setUploadedDocs(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [workspace.id, isReadOnly]);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      alert("Demo Mode: Ingesting new knowledge base files is restricted in the public read-only Demo Workspace.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    setIsDocUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/documents`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        fetchDocuments();
        fetchTimeline();
      } else {
        alert(data.error || 'Failed to upload document.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload error.');
    } finally {
      setIsDocUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (isReadOnly) {
      alert("Demo Mode: Deleting indexed files is restricted in the public read-only Demo Workspace.");
      return;
    }
    if (!confirm('Are you sure you want to delete this document and all its embedded memories?')) return;
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/documents?documentId=${docId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchDocuments();
        fetchTimeline();
      } else {
        alert(data.error || 'Failed to delete document.');
      }
    } catch (err) {
      console.error('Delete document error:', err);
    }
  };

  // --- Timeline Fetching Handler ---
  const fetchTimeline = useCallback(async () => {
    if (isReadOnly) {
      setTimelineEvents([
        { id: '1', event_type: 'creation', title: 'Workspace Created', description: 'Venture Operating System commissioned for EcoThread India.', created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString() },
        { id: '2', event_type: 'report', title: 'Feasibility Report generated', description: 'SWOT and feasibility parameters established.', created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString() },
        { id: '3', event_type: 'branding', title: 'Branding Assets customized', description: 'Color palette, positioning statement, and slogan vectors mapped.', created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString() },
        { id: '4', event_type: 'document', title: 'Market Survey document indexed', description: 'Grounded target supplier contexts in vector store memory.', created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
      ]);
      setIsLoadingTimeline(false);
      return;
    }
    setIsLoadingTimeline(true);
    try {
      const res = await getWorkspaceTimeline(workspace.id, timelineFilter);
      if (res.success && res.data) {
        setTimelineEvents(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setIsLoadingTimeline(false);
    }
  }, [workspace.id, timelineFilter, isReadOnly]);

  // --- Memory Semantic Search Handler ---
  const handleMemorySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (isReadOnly) {
      setIsSearching(true);
      setTimeout(() => {
        setSearchResults([
          { content: "Organic cotton fabric supplier: Cotton Co-Op, Tiruppur, Tamil Nadu. Pre-negotiated pricing: ₹180 per meter.", similarity: 0.92, metadata: { source: "Chennai textile supplier directory.txt" } },
          { content: "EcoThread target market: Metropolitan college students, age range 18-24. High interest in affordable sustainable garments.", similarity: 0.85, metadata: { source: "Target Market Survey.pdf" } }
        ]);
        setIsSearching(false);
      }, 500);
      return;
    }
    setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success === false || data.error) {
        setSearchError(data.error || 'Failed to search memories.');
        setSearchResults([]);
      } else if (data.data) {
        setSearchResults(data.data);
      }
    } catch (err: any) {
      console.error('Failed to search memories:', err);
      setSearchError(err.message || 'Failed to search memories.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // --- Venture Health Score Handler ---
  const fetchHealthScore = useCallback(async () => {
    if (isReadOnly) {
      setHealthScoreData({
        overall: 85,
        validation: 100,
        branding: 80,
        marketing: 60,
        financial: 80,
        knowledge: 75,
        recommendations: [
          "Deploy the generated Next.js landing page to DU campuses to begin pre-orders.",
          "Verify the ₹8,000/month overhead costs against Tiruppur fabric supplier prices.",
          "Add a backup cotton coop distributor in Chennai to minimize inventory risks."
        ]
      });
      setIsLoadingHealth(false);
      return;
    }
    setIsLoadingHealth(true);
    try {
      const res = await getWorkspaceHealthScore(workspace.id);
      if (res.success && res.data) {
        setHealthScoreData(res.data);
        if (res.data.circuitBreakerActive) {
          setCircuitBreakerActive(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch health score:', err);
    } finally {
      setIsLoadingHealth(false);
    }
  }, [workspace.id, isReadOnly]);

  // --- Knowledge Grounded AI Assistant Handler ---
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim() || isChatSending) return;
    
    const userMsg = chatMessage;
    setChatMessage('');
    
    const newUserMessage = { role: 'user' as const, parts: [{ text: userMsg }] };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setIsChatSending(true);
    
    if (isReadOnly) {
      setTimeout(() => {
        let answer = "As your AI co-founder, I've scanned the indexed 'Gen-Z Campus Merch Plan.pdf' knowledge base file. EcoThread India has an 85% readiness score. Our projected target market covers urban Indian college campuses (SOM of ₹12 Cr in Year 1-2). Let me know if you would like me to detail the weekly supply chain tasks or outline the Instagram calendar posts!";
        
        const lowercaseMsg = userMsg.toLowerCase();
        if (lowercaseMsg.includes('swot') || lowercaseMsg.includes('feasibility') || lowercaseMsg.includes('report')) {
          answer = "According to our feasibility report, EcoThread's strengths include 100% organic cotton fabrics from local farm co-ops and low production overhead. A key threat is fast fashion competition, which we mitigate by offering direct campus delivery at a ₹499 price point.";
        } else if (lowercaseMsg.includes('brand') || lowercaseMsg.includes('color') || lowercaseMsg.includes('name')) {
          answer = "Our Branding Studio has selected 'EcoThread India' (availability: Available). The color hex palette is primary: #10B981 (emerald), secondary: #6366F1 (indigo). The main tagline is 'Organic. Affordable. Yours.' which resonates with college students.";
        } else if (lowercaseMsg.includes('finance') || lowercaseMsg.includes('cost') || lowercaseMsg.includes('break')) {
          answer = "Our Year 1 fixed overhead is ₹8,000/month. At ₹800 average unit revenue and 60% profit margin, our monthly break-even target is exactly 17 units. Projected Month 12 revenues reach ₹1,00,000.";
        } else if (lowercaseMsg.includes('marketing') || lowercaseMsg.includes('instagram')) {
          answer = "We've scheduled Instagram flash sales and WhatsApp group loops. Our content calendar features student models wearing hoodies with hashtags #green #fashion. LinkedIn posts share our sustainable development story.";
        } else if (lowercaseMsg.includes('member') || lowercaseMsg.includes('team') || lowercaseMsg.includes('collab')) {
          answer = "Our Team OS tracks active members. Current members include Delhi University representatives (Editors) and VC Investment leads (Viewers). Snapshot versions of branding and projections are saved for rollbacks.";
        }

        setChatHistory((prev) => [...prev, { role: 'model' as const, parts: [{ text: answer }] }]);
        setChatSources(["Gen-Z Campus Merch Plan.pdf:L12-35"]);
        setIsChatSending(false);
      }, 1000);
      return;
    }

    try {
      const res = await queryKnowledgeAssistant(workspace.id, userMsg, [...chatHistory, newUserMessage]);
      if (res.success && res.data) {
        setChatHistory((prev) => [...prev, { role: 'model' as const, parts: [{ text: res.data }] }]);
        if (res.sources) {
          setChatSources(res.sources as string[]);
        } else {
          setChatSources([]);
        }
        if (res.circuitBreakerActive) setCircuitBreakerActive(true);
        fetchTimeline();
      } else {
        const logIdSuffix = res.logId ? ` (Reference ID: ${res.logId})` : '';
        const errMsg = `${res.error || 'Failed to generate response.'}${logIdSuffix}`;
        const intercepted = handleActionError(errMsg, "Upgrade for AI Chat");
        if (!intercepted) {
          setChatHistory((prev) => [...prev, { role: 'model' as const, parts: [{ text: `Error: ${errMsg}` }] }]);
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg = err.message || 'An unexpected error occurred.';
      const intercepted = handleActionError(errMsg, "Upgrade for AI Chat");
      if (!intercepted) {
        setChatHistory((prev) => [...prev, { role: 'model' as const, parts: [{ text: `Error: ${errMsg}` }] }]);
      }
    } finally {
      setIsChatSending(false);
    }
  };

  // --- Auto Loaders ---
  useEffect(() => {
    fetchHealthScore();
  }, [fetchHealthScore]);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    } else if (activeTab === 'memory') {
      fetchTimeline();
    }
  }, [activeTab, fetchDocuments, fetchTimeline]);

  useEffect(() => {
    if (activeTab === 'memory') {
      fetchTimeline();
    }
  }, [timelineFilter, fetchTimeline, activeTab]);

  // Branding Studio Selections State
  const [selectedName, setSelectedName] = useState(branding?.brand_name || branding?.brand_names?.[0]?.name || '');
  const [selectedTagline, setSelectedTagline] = useState(branding?.tagline || branding?.slogans?.[0] || '');
  const [selectedVoice, setSelectedVoice] = useState(branding?.brand_voice || 'Eco-conscious & Professional');
  const [selectedPalette, setSelectedPalette] = useState({
    primary: branding?.color_palette?.primary || '#10B981',
    secondary: branding?.color_palette?.secondary || '#6366F1',
    accent: branding?.color_palette?.accent || '#F59E0B',
    background: branding?.color_palette?.background || '#090D16'
  });
  const [selectedLogoPrompt, setSelectedLogoPrompt] = useState(branding?.logo_prompt || branding?.logo_prompts?.[0] || '');

  // Generation pool lists
  const [namesPool, setNamesPool] = useState(branding?.brand_names || []);
  const [taglinesPool, setTaglinesPool] = useState(branding?.slogans || []);
  const [logoPromptsPool, setLogoPromptsPool] = useState(branding?.logo_prompts || []);

  // UI inputs and loader states
  const [nameKeywords, setNameKeywords] = useState('');
  const [isGeneratingNames, setIsGeneratingNames] = useState(false);

  const [voiceTone, setVoiceTone] = useState('Eco-conscious & Vibrant');
  const [isGeneratingTaglines, setIsGeneratingTaglines] = useState(false);

  const [colorVibe, setColorVibe] = useState('Nature / Sustainable Green / Earth');
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);

  const [logoStyle, setLogoStyle] = useState('Minimalist geometric outline vector logo');
  const [isGeneratingLogoPrompts, setIsGeneratingLogoPrompts] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Roadmap State Managers
  const [plan30Day, setPlan30Day] = useState<any[]>(roadmap?.plan_30_day || []);
  const [plan90Day, setPlan90Day] = useState<any[]>(roadmap?.plan_90_day || []);
  const [launchRoadmap, setLaunchRoadmap] = useState<string[]>(roadmap?.launch_roadmap || []);
  const [growthRoadmap, setGrowthRoadmap] = useState<string[]>(roadmap?.growth_roadmap || []);

  const [roadmapFocus, setRoadmapFocus] = useState('');
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isSavingRoadmap, setIsSavingRoadmap] = useState(false);
  const [roadmapSaveStatus, setRoadmapSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [roadmapSaveMessage, setRoadmapSaveMessage] = useState('');
  const [checkedLaunchTasks, setCheckedLaunchTasks] = useState<Record<number, boolean>>({});

  // 30-Day plan helpers
  const updateWeekGoal = (index: number, newGoal: string) => {
    const updated = [...plan30Day];
    if (updated[index]) {
      updated[index] = { ...updated[index], goal: newGoal };
      setPlan30Day(updated);
    }
  };

  const updateWeekTask = (weekIndex: number, taskIndex: number, newTaskValue: string) => {
    const updated = [...plan30Day];
    if (updated[weekIndex]?.tasks) {
      const tasks = [...updated[weekIndex].tasks];
      tasks[taskIndex] = newTaskValue;
      updated[weekIndex] = { ...updated[weekIndex], tasks };
      setPlan30Day(updated);
    }
  };

  const addWeekTask = (weekIndex: number) => {
    const updated = [...plan30Day];
    if (updated[weekIndex]?.tasks) {
      const tasks = [...updated[weekIndex].tasks, 'New task description'];
      updated[weekIndex] = { ...updated[weekIndex], tasks };
      setPlan30Day(updated);
    }
  };

  const deleteWeekTask = (weekIndex: number, taskIndex: number) => {
    const updated = [...plan30Day];
    if (updated[weekIndex]?.tasks) {
      const tasks = updated[weekIndex].tasks.filter((_: any, idx: number) => idx !== taskIndex);
      updated[weekIndex] = { ...updated[weekIndex], tasks };
      setPlan30Day(updated);
    }
  };

  // 90-Day plan helpers
  const updateMonthTarget = (index: number, newTarget: string) => {
    const updated = [...plan90Day];
    if (updated[index]) {
      updated[index] = { ...updated[index], target: newTarget };
      setPlan90Day(updated);
    }
  };

  const updateMonthMilestone = (monthIndex: number, milestoneIndex: number, newValue: string) => {
    const updated = [...plan90Day];
    if (updated[monthIndex]?.sub_milestones) {
      const ms = [...updated[monthIndex].sub_milestones];
      ms[milestoneIndex] = newValue;
      updated[monthIndex] = { ...updated[monthIndex], sub_milestones: ms };
      setPlan90Day(updated);
    }
  };

  const addMonthMilestone = (monthIndex: number) => {
    const updated = [...plan90Day];
    if (updated[monthIndex]?.sub_milestones) {
      const ms = [...updated[monthIndex].sub_milestones, 'New milestone target'];
      updated[monthIndex] = { ...updated[monthIndex], sub_milestones: ms };
      setPlan90Day(updated);
    }
  };

  const deleteMonthMilestone = (monthIndex: number, milestoneIndex: number) => {
    const updated = [...plan90Day];
    if (updated[monthIndex]?.sub_milestones) {
      const ms = updated[monthIndex].sub_milestones.filter((_: any, idx: number) => idx !== milestoneIndex);
      updated[monthIndex] = { ...updated[monthIndex], sub_milestones: ms };
      setPlan90Day(updated);
    }
  };

  // Launch checklist helpers
  const updateLaunchTask = (index: number, newValue: string) => {
    const updated = [...launchRoadmap];
    updated[index] = newValue;
    setLaunchRoadmap(updated);
  };

  const addLaunchTask = () => {
    setLaunchRoadmap([...launchRoadmap, 'New launch checklist item']);
  };

  const deleteLaunchTask = (index: number) => {
    const updated = launchRoadmap.filter((_, idx) => idx !== index);
    setLaunchRoadmap(updated);
    const newChecked = { ...checkedLaunchTasks };
    delete newChecked[index];
    setCheckedLaunchTasks(newChecked);
  };

  const toggleLaunchTaskCheck = (index: number) => {
    setCheckedLaunchTasks({
      ...checkedLaunchTasks,
      [index]: !checkedLaunchTasks[index]
    });
  };

  // Growth milestones helpers
  const updateGrowthMilestone = (index: number, newValue: string) => {
    const updated = [...growthRoadmap];
    updated[index] = newValue;
    setGrowthRoadmap(updated);
  };

  const addGrowthMilestone = () => {
    setGrowthRoadmap([...growthRoadmap, 'New growth milestone target']);
  };

  const deleteGrowthMilestone = (index: number) => {
    const updated = growthRoadmap.filter((_, idx) => idx !== index);
    setGrowthRoadmap(updated);
  };

  const handleGenerateRoadmap = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Generating customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    if (!roadmapFocus) return;
    setIsGeneratingRoadmap(true);
    setRoadmapError('');
    setRoadmapLogId('');
    setRoadmapSaveStatus('idle');
    setRoadmapSaveMessage('');
    try {
      const res = await generateCustomRoadmap(workspace.id, roadmapFocus);
      if (res.success && res.data) {
        setPlan30Day(res.data.plan_30_day || []);
        setPlan90Day(res.data.plan_90_day || []);
        setLaunchRoadmap(res.data.launch_roadmap || []);
        setGrowthRoadmap(res.data.growth_roadmap || []);
        setCheckedLaunchTasks({});
        if (res.circuitBreakerActive) setCircuitBreakerActive(true);
      } else {
        setRoadmapError(res.error || 'Failed to generate roadmap.');
        setRoadmapLogId(res.logId || '');
      }
    } catch (err: any) {
      console.error(err);
      setRoadmapError(err.message || 'Error occurred during roadmap generation.');
      setRoadmapLogId(`ERR-ROADMAP-${Date.now()}`);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleSaveRoadmap = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Saving customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    setIsSavingRoadmap(true);
    setRoadmapSaveStatus('idle');
    setRoadmapSaveMessage('');
    try {
      const res = await saveWorkspaceRoadmap(workspace.id, {
        plan_30_day: plan30Day,
        plan_90_day: plan90Day,
        launch_roadmap: launchRoadmap,
        growth_roadmap: growthRoadmap
      });
      if (res.success) {
        setRoadmapSaveStatus('success');
        setRoadmapSaveMessage(res.message || 'Roadmap successfully saved!');
        setTimeout(() => setRoadmapSaveStatus('idle'), 3000);
      } else {
        setRoadmapSaveStatus('error');
        setRoadmapSaveMessage(res.error || 'Failed to save roadmap.');
      }
    } catch (err: any) {
      console.error(err);
      setRoadmapSaveStatus('error');
      setRoadmapSaveMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSavingRoadmap(false);
    }
  };

  // Marketing State Managers
  const [instagramCampaigns, setInstagramCampaigns] = useState<any[]>(marketing?.instagram_campaigns || []);
  const [linkedinCampaigns, setLinkedinCampaigns] = useState<any[]>(marketing?.linkedin_campaigns || []);
  const [emailSequences, setEmailSequences] = useState<any[]>(marketing?.email_sequences || []);
  const [adCopy, setAdCopy] = useState<any>(marketing?.ad_copy || { google: [], meta: [], linkedin: [] });
  const [contentCalendar, setContentCalendar] = useState<any[]>(marketing?.content_calendar || []);

  const [marketingFocus, setMarketingFocus] = useState('');
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
  const [isSavingMarketing, setIsSavingMarketing] = useState(false);
  const [marketingSaveStatus, setMarketingSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [marketingSaveMessage, setMarketingSaveMessage] = useState('');

  // Financial State Managers
  const [startupCosts, setStartupCosts] = useState<any[]>(finance?.startup_costs || []);
  const [revenueProjections, setRevenueProjections] = useState<(number | '')[]>(safeParseProjections(finance?.revenue_projections));
  const [expenseForecasts, setExpenseForecasts] = useState<(number | '')[]>(safeParseProjections(finance?.expense_forecasts));
  const [breakEven, setBreakEven] = useState<any>(finance?.break_even_analysis || { fixed_monthly_overhead: 0, revenue_per_unit: 0, margin_percentage: 0 });

  const [financeFocus, setFinanceFocus] = useState('');
  const [isGeneratingFinance, setIsGeneratingFinance] = useState(false);
  const [isSavingFinance, setIsSavingFinance] = useState(false);
  const [financeSaveStatus, setFinanceSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [financeSaveMessage, setFinanceSaveMessage] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Landing Page State Managers
  const [heroTitle, setHeroTitle] = useState(landingPage?.hero?.title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(landingPage?.hero?.subtitle || '');
  const [heroCtaText, setHeroCtaText] = useState(landingPage?.hero?.cta_text || 'Get Started');
  const [heroCtaUrl, setHeroCtaUrl] = useState(landingPage?.hero?.cta_url || '#pricing');

  const [featuresList, setFeaturesList] = useState<any[]>(landingPage?.features || [
    { title: '100% Certified Organic', description: 'GOTS certified organic cotton sourced from local cooperative farms in India.', icon: 'Leaf' },
    { title: 'Zero Waste Production', description: 'Printed on-demand to limit inventory waste and keep student pricing competitive.', icon: 'Zap' },
    { title: 'Direct Campus Deliveries', description: 'WhatsApp rep network delivers items directly to your dorm hotspots.', icon: 'Users' }
  ]);
  const [pricingPlans, setPricingPlans] = useState<any[]>(landingPage?.pricing || [
    { name: 'Eco Rep Tee', price: 'â‚¹499', period: 'one-time', features: ['100% Organic Cotton', 'Screen printed label', 'Free campus delivery'], is_popular: false, button_text: 'Pre-order Tee' },
    { name: 'Campus Hoodie', price: 'â‚¹1,299', period: 'one-time', features: ['Heavyweight fleece', 'Embroidered leaf logo', 'Priority WhatsApp support'], is_popular: true, button_text: 'Pre-order Hoodie' },
    { name: 'Squad Pack', price: 'â‚¹2,499', period: 'one-time', features: ['3 custom tees', '1 hoodie', 'Free canvas tote bag'], is_popular: false, button_text: 'Pre-order Bundle' }
  ]);
  const [testimonialsList, setTestimonialsList] = useState<any[]>(landingPage?.testimonials || [
    { name: 'Aarav Sharma', role: 'Campus Rep', company: 'Delhi University', content: 'EcoThread hoodies are incredibly soft. All my classmates are pre-ordering because they want sustainable clothing that fits their budget!' },
    { name: 'Ananya Iyer', role: 'Student Designer', company: 'NIFT Mumbai', content: 'It is amazing to see a brand focus on local farm cooperatives while keeping streetwear aesthetics super fresh and relevant.' }
  ]);
  const [faqsList, setFaqsList] = useState<any[]>(landingPage?.faqs || [
    { question: 'Is the cotton truly organic?', answer: 'Yes! We only use GOTS (Global Organic Textile Standard) certified cotton sourced from ethical local farmers.' },
    { question: 'How does campus delivery work?', answer: 'Our student ambassadors distribute orders directly at campus hotspots, saving you shipping costs!' }
  ]);

  const [landingPageCode, setLandingPageCode] = useState(landingPage?.code || '');
  const [editCodeManually, setEditCodeManually] = useState(false);

  const [landingPageFocus, setLandingPageFocus] = useState('');
  const [isGeneratingLandingPage, setIsGeneratingLandingPage] = useState(false);
  const [isSavingLandingPage, setIsSavingLandingPage] = useState(false);
  const [landingPageSaveStatus, setLandingPageSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [landingPageSaveMessage, setLandingPageSaveMessage] = useState('');

  // Preview interactive state
  const [previewFaqIndex, setPreviewFaqIndex] = useState<number | null>(null);
  const [previewTestimonialIndex, setPreviewTestimonialIndex] = useState(0);

  // Features Helpers
  const addFeature = () => {
    setFeaturesList([...featuresList, { title: 'New Feature', description: 'Benefit explanation', icon: 'Zap' }]);
  };
  const updateFeature = (index: number, fields: any) => {
    const updated = [...featuresList];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fields };
      setFeaturesList(updated);
    }
  };
  const deleteFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, idx) => idx !== index));
  };

  // Pricing Helpers
  const addPricingPlan = () => {
    setPricingPlans([...pricingPlans, { name: 'New Tier', price: 'â‚¹999', period: 'one-time', features: ['Feature Benefit 1'], is_popular: false, button_text: 'Select' }]);
  };
  const updatePricingPlan = (index: number, fields: any) => {
    const updated = [...pricingPlans];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fields };
      setPricingPlans(updated);
    }
  };
  const deletePricingPlan = (index: number) => {
    setPricingPlans(pricingPlans.filter((_, idx) => idx !== index));
  };

  // Testimonials Helpers
  const addTestimonial = () => {
    setTestimonialsList([...testimonialsList, { name: 'User Name', role: 'Role', company: 'Company', content: 'Testimonial content feedback...' }]);
  };
  const updateTestimonial = (index: number, fields: any) => {
    const updated = [...testimonialsList];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fields };
      setTestimonialsList(updated);
    }
  };
  const deleteTestimonial = (index: number) => {
    setTestimonialsList(testimonialsList.filter((_, idx) => idx !== index));
  };

  // FAQs Helpers
  const addFaq = () => {
    setFaqsList([...faqsList, { question: 'New Question?', answer: 'Answer details...' }]);
  };
  const updateFaq = (index: number, fields: any) => {
    const updated = [...faqsList];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fields };
      setFaqsList(updated);
    }
  };
  const deleteFaq = (index: number) => {
    setFaqsList(faqsList.filter((_, idx) => idx !== index));
  };

  // Next.js React Code compiler template helper
  const generateNextJsCode = useCallback((
    hTitle: string, hSub: string, hCta: string, hCtaUrl: string,
    feats: any[], prices: any[], tests: any[], questions: any[]
  ) => {
    return `'use client';

import React, { useState } from 'react';
import { Leaf, Shield, Users, Zap, Globe, Star, ArrowRight, ChevronDown, Check } from 'lucide-react';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-400 overflow-x-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-lg tracking-tight">
              ${selectedName || workspace.name}
            </span>
          </div>
          <a
            href="${hCtaUrl}"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-emerald-400 hover:bg-emerald-350 rounded-xl transition-all"
          >
            ${hCta}
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase rounded-full mb-6">
          Now Live
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          ${hTitle}
        </h1>
        <p className="mt-6 text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
          ${hSub}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a
            href="${hCtaUrl}"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-white bg-emerald-400 hover:bg-emerald-350 rounded-xl transition-all gap-2"
          >
            ${hCta} <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50 border-t border-b border-slate-200 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Why Choose Us</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">Engineered for quality, accessibility, and high performance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {${JSON.stringify(feats)}.map((feat, idx) => {
              return (
                <div key={idx} className="p-6 bg-slate-50/40 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit text-emerald-700 mb-4">
                    {idx === 0 && <Leaf className="w-5 h-5" />}
                    {idx === 1 && <Zap className="w-5 h-5" />}
                    {idx === 2 && <Users className="w-5 h-5" />}
                    {idx > 2 && <Globe className="w-5 h-5" />}
                  </div>
                  <h3 className="text-base font-bold text-slate-800">{feat.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Simple Pricing</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">Fair, transparent billing built around your growth.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 items-stretch">
          {${JSON.stringify(prices)}.map((plan, idx) => {
            return (
              <div
                key={idx}
                className={\`p-6 rounded-2xl flex flex-col justify-between border transition-all \${
                  plan.is_popular
                    ? 'bg-slate-50 border-emerald-500/50 shadow-lg shadow-emerald-950/10'
                    : 'bg-slate-50/45 border-slate-100 hover:border-slate-200'
                }\`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{plan.name}</span>
                    {plan.is_popular && (
                      <span className="px-2 py-0.5 bg-emerald-400 text-white text-[8px] font-extrabold uppercase rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-xs text-slate-500">/ {plan.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feat, fidx) => (
                      <li key={fidx} className="text-xs text-slate-500 flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  className={\`w-full mt-8 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] \${
                    plan.is_popular
                      ? 'bg-emerald-400 hover:bg-emerald-350 text-white'
                      : 'bg-white border border-slate-200 hover:border-slate-700 text-slate-800'
                  }\`}
                >
                  {plan.button_text || 'Get Started'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white/50 border-t border-b border-slate-200 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1 text-amber-400 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {${JSON.stringify(tests)}.map((test, idx) => (
              <div key={idx} className="p-6 bg-slate-50/40 border border-slate-100 rounded-2xl text-left flex flex-col justify-between">
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">"{test.content}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-slate-750 uppercase">
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{test.name}</h4>
                    <p className="text-[10px] text-slate-500"> {test.role} at {test.company} </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-bold text-white text-center tracking-tight mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {${JSON.stringify(questions)}.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="border border-slate-200 bg-white/40 rounded-2xl overflow-hidden transition-all">
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/30 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{faq.question}</span>
                  <ChevronDown className={\`w-4 h-4 text-slate-600 transition-transform duration-200 \${isOpen ? 'rotate-180' : ''}\`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 border-t border-slate-200/40 pt-3 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white/30 text-center text-[10px] text-slate-650 uppercase tracking-widest px-4">
        &copy; {new Date().getFullYear()} \${selectedName || workspace.name}. All Rights Reserved. Powered by StartupOS AI.
      </footer>
    </div>
  );
}
`;
  }, [selectedName, workspace.name]);

  // Sync templates on form states updates
  useEffect(() => {
    if (!editCodeManually) {
      const compiledCode = generateNextJsCode(
        heroTitle, heroSubtitle, heroCtaText, heroCtaUrl,
        featuresList, pricingPlans, testimonialsList, faqsList
      );
      setLandingPageCode(compiledCode);
    }
  }, [
    heroTitle, heroSubtitle, heroCtaText, heroCtaUrl,
    featuresList, pricingPlans, testimonialsList, faqsList,
    editCodeManually, selectedName, workspace.name, generateNextJsCode
  ]);

  const handleGenerateLandingPage = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Generating customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    if (!landingPageFocus) return;
    setIsGeneratingLandingPage(true);
    setLandingPageError('');
    setLandingPageLogId('');
    setLandingPageSaveStatus('idle');
    setLandingPageSaveMessage('');
    try {
      const res = await generateCustomLandingPage(workspace.id, landingPageFocus);
      if (res.success && res.data) {
        setHeroTitle(res.data.hero?.title || '');
        setHeroSubtitle(res.data.hero?.subtitle || '');
        setHeroCtaText(res.data.hero?.cta_text || 'Get Started');
        setHeroCtaUrl(res.data.hero?.cta_url || '#pricing');
        setFeaturesList(res.data.features || []);
        setPricingPlans(res.data.pricing || []);
        setTestimonialsList(res.data.testimonials || []);
        setFaqsList(res.data.faqs || []);
        if (res.data.code) {
          setLandingPageCode(res.data.code);
          setEditCodeManually(true);
        } else {
          setEditCodeManually(false);
        }
        if (res.circuitBreakerActive) setCircuitBreakerActive(true);
      } else {
        setLandingPageError(res.error || 'Failed to generate landing page.');
        setLandingPageLogId(res.logId || '');
      }
    } catch (err: any) {
      console.error(err);
      setLandingPageError(err.message || 'Error occurred during landing page generation.');
      setLandingPageLogId(`ERR-LANDING-${Date.now()}`);
    } finally {
      setIsGeneratingLandingPage(false);
    }
  };

  const handleSaveLandingPage = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Saving customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    setIsSavingLandingPage(true);
    setLandingPageSaveStatus('idle');
    setLandingPageSaveMessage('');
    try {
      const res = await saveWorkspaceLandingPage(workspace.id, {
        hero: {
          title: heroTitle,
          subtitle: heroSubtitle,
          cta_text: heroCtaText,
          cta_url: heroCtaUrl
        },
        features: featuresList,
        pricing: pricingPlans,
        testimonials: testimonialsList,
        faqs: faqsList,
        code: landingPageCode
      });
      if (res.success) {
        setLandingPageSaveStatus('success');
        setLandingPageSaveMessage(res.message || 'Landing page successfully saved!');
        setTimeout(() => setLandingPageSaveStatus('idle'), 3000);
      } else {
        setLandingPageSaveStatus('error');
        setLandingPageSaveMessage(res.error || 'Failed to save landing page.');
      }
    } catch (err: any) {
      console.error(err);
      setLandingPageSaveStatus('error');
      setLandingPageSaveMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSavingLandingPage(false);
    }
  };

  const exportLandingPageFile = () => {
    try {
      const element = document.createElement("a");
      const file = new Blob([landingPageCode], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${workspace.name.toLowerCase().replace(/\s+/g, '-')}-landing-page.tsx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('File Download Error:', error);
      alert('Error downloading TSX file.');
    }
  };

  const renderFeatureIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'leaf': return <Leaf className="w-5 h-5 text-emerald-700" />;
      case 'zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'users': return <Users className="w-5 h-5 text-indigo-700" />;
      case 'globe': return <Globe className="w-5 h-5 text-sky-400" />;
      case 'shield': return <Shield className="w-5 h-5 text-emerald-455" />;
      case 'star': return <Star className="w-5 h-5 text-amber-405" />;
      default: return <Zap className="w-5 h-5 text-emerald-700" />;
    }
  };

  // Pitch Deck State Managers
  const [problemStatement, setProblemStatement] = useState(pitchDeck?.problem_statement || '');
  const [solution, setSolution] = useState(pitchDeck?.solution || '');
  const [marketSize, setMarketSize] = useState({
    tam: pitchDeck?.market_size?.tam || '',
    sam: pitchDeck?.market_size?.sam || '',
    som: pitchDeck?.market_size?.som || '',
  });
  const [businessModel, setBusinessModel] = useState(pitchDeck?.business_model || '');
  const [gtmStrategy, setGtmStrategy] = useState(pitchDeck?.go_to_market || '');
  const [customSlides, setCustomSlides] = useState<any[]>(pitchDeck?.slides || []);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [pitchDeckFocus, setPitchDeckFocus] = useState('');
  const [isGeneratingPitchDeck, setIsGeneratingPitchDeck] = useState(false);
  const [isSavingPitchDeck, setIsSavingPitchDeck] = useState(false);
  const [pitchDeckSaveStatus, setPitchDeckSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pitchDeckSaveMessage, setPitchDeckSaveMessage] = useState('');

  // Custom Slides Helpers
  const addCustomSlide = () => {
    setCustomSlides([...customSlides, { title: 'New Slide', content: 'New slide content', visual_layout_suggestion: 'Bullet point list layout' }]);
  };

  const updateCustomSlide = (index: number, fields: any) => {
    const updated = [...customSlides];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fields };
      setCustomSlides(updated);
    }
  };

  const deleteCustomSlide = (index: number) => {
    setCustomSlides(customSlides.filter((_, idx) => idx !== index));
    const totalSlidesAfterDelete = customSlides.length + 5; // title + 5 core slides
    if (activeSlideIndex >= totalSlidesAfterDelete) {
      setActiveSlideIndex(Math.max(0, totalSlidesAfterDelete - 1));
    }
  };

  // Compile list of all slides for live previewing and export
  const allSlides = [
    {
      title: workspace.name || 'Startup Pitch Deck',
      content: `${branding?.tagline || workspace.description || 'Elevating the future.'}\n\nIndustry: ${workspace.industry}\nTarget Market: ${workspace.target_market}`,
      visual_layout_suggestion: 'Clean centered typography with brand gradient background.',
      type: 'title'
    },
    {
      title: 'The Problem',
      content: problemStatement,
      visual_layout_suggestion: 'High-contrast bulleted pain points with red/rose outline cards.',
      type: 'problem'
    },
    {
      title: 'The Solution',
      content: solution,
      visual_layout_suggestion: 'Centered product mockup or key value prop boxes in emerald/green outline.',
      type: 'solution'
    },
    {
      title: 'Market Size (TAM / SAM / SOM)',
      content: `TAM: ${marketSize.tam}\nSAM: ${marketSize.sam}\nSOM: ${marketSize.som}`,
      visual_layout_suggestion: 'Three horizontal metrics columns or progressive size cards.',
      type: 'market'
    },
    {
      title: 'Business Model',
      content: businessModel,
      visual_layout_suggestion: 'Clean grid columns outlining monetization streams and pricing tiers.',
      type: 'business_model'
    },
    {
      title: 'Go-To-Market (GTM) Strategy',
      content: gtmStrategy,
      visual_layout_suggestion: 'Horizontal timeline stages or customer onboarding loop visuals.',
      type: 'gtm'
    },
    ...customSlides.map((slide, idx) => ({
      title: slide.title || `Slide ${idx + 7}`,
      content: slide.content || '',
      visual_layout_suggestion: slide.visual_layout_suggestion || 'Bullet point checklist format.',
      type: 'custom'
    }))
  ];

  const handleGeneratePitchDeck = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Generating customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    if (!pitchDeckFocus) return;
    setIsGeneratingPitchDeck(true);
    setPitchDeckError('');
    setPitchDeckLogId('');
    setPitchDeckSaveStatus('idle');
    setPitchDeckSaveMessage('');
    try {
      const res = await generateCustomPitchDeck(workspace.id, pitchDeckFocus);
      if (res.success && res.data) {
        setProblemStatement(res.data.problem_statement || '');
        setSolution(res.data.solution || '');
        setMarketSize({
          tam: res.data.market_size?.tam || '',
          sam: res.data.market_size?.sam || '',
          som: res.data.market_size?.som || '',
        });
        setBusinessModel(res.data.business_model || '');
        setGtmStrategy(res.data.go_to_market || '');
        setCustomSlides(res.data.slides || []);
        setActiveSlideIndex(0);
        if (res.circuitBreakerActive) setCircuitBreakerActive(true);
      } else {
        setPitchDeckError(res.error || 'Failed to generate pitch deck.');
        setPitchDeckLogId(res.logId || '');
      }
    } catch (err: any) {
      console.error(err);
      setPitchDeckError(err.message || 'Error occurred during pitch deck generation.');
      setPitchDeckLogId(`ERR-PITCH-${Date.now()}`);
    } finally {
      setIsGeneratingPitchDeck(false);
    }
  };

  const handleSavePitchDeck = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Saving customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    setIsSavingPitchDeck(true);
    setPitchDeckSaveStatus('idle');
    setPitchDeckSaveMessage('');
    try {
      const res = await saveWorkspacePitchDeck(workspace.id, {
        problem_statement: problemStatement,
        solution: solution,
        market_size: marketSize,
        business_model: businessModel,
        go_to_market: gtmStrategy,
        slides: customSlides
      });
      if (res.success) {
        setPitchDeckSaveStatus('success');
        setPitchDeckSaveMessage(res.message || 'Pitch deck successfully saved!');
        setTimeout(() => setPitchDeckSaveStatus('idle'), 3000);
      } else {
        setPitchDeckSaveStatus('error');
        setPitchDeckSaveMessage(res.error || 'Failed to save pitch deck.');
      }
    } catch (err: any) {
      console.error(err);
      setPitchDeckSaveStatus('error');
      setPitchDeckSaveMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSavingPitchDeck(false);
    }
  };

  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      allSlides.forEach((slide, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Draw background
        doc.setFillColor(11, 15, 25);
        doc.rect(0, 0, width, height, 'F');

        // Draw top accent line
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, width / 2, 6, 'F');
        doc.setFillColor(99, 102, 241);
        doc.rect(width / 2, 0, width / 2, 6, 'F');

        if (slide.type === 'title') {
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(44);
          doc.text(slide.title.toUpperCase(), 80, 220);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(18);
          doc.setTextColor(148, 163, 184);
          
          const lines = doc.splitTextToSize(slide.content, 680);
          doc.text(lines, 80, 280);

          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text('STARTUP PITCH DECK  |  POWERED BY STARTUPOS AI', 80, 520);
        } else {
          doc.setTextColor(16, 185, 129);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(28);
          doc.text(slide.title, 80, 100);

          doc.setFillColor(99, 102, 241);
          doc.rect(80, 115, 80, 3, 'F');

          doc.setTextColor(226, 232, 240);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(15);

          if (slide.type === 'market') {
            doc.setFillColor(20, 27, 45);
            
            // TAM Box
            doc.rect(80, 160, 680, 80, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL ADDRESSABLE MARKET (TAM)', 100, 190);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(226, 232, 240);
            doc.text(marketSize.tam || 'Total market size', 100, 215);

            // SAM Box
            doc.setFillColor(20, 27, 45);
            doc.rect(80, 260, 680, 80, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('SERVICEABLE ADDRESSABLE MARKET (SAM)', 100, 290);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(226, 232, 240);
            doc.text(marketSize.sam || 'Target segment size', 100, 315);

            // SOM Box
            doc.setFillColor(20, 27, 45);
            doc.rect(80, 380, 680, 80, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('SERVICEABLE OBTAINABLE MARKET (SOM)', 100, 410);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(226, 232, 240);
            doc.text(marketSize.som || 'Year 1-2 reachable market', 100, 435);
          } else {
            const lines = doc.splitTextToSize(slide.content, 680);
            doc.text(lines, 80, 170, { lineHeightFactor: 1.5 });
          }

          if (slide.visual_layout_suggestion) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            const sugText = `Visual Suggestion: ${slide.visual_layout_suggestion}`;
            const sugLines = doc.splitTextToSize(sugText, 680);
            doc.text(sugLines, 80, 500);
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(workspace.name.toUpperCase(), 80, 545);
          doc.text(`Page ${index + 1} of ${allSlides.length}`, width - 120, 545);
        }
      });

      doc.save(`${workspace.name.toLowerCase().replace(/\s+/g, '-')}-pitch-deck.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Error generating PDF. Please make sure all slide content is valid.');
    }
  };

  // Startup Costs Helpers
  const updateStartupCost = (index: number, fields: any) => {
    const updated = [...startupCosts];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fields };
      setStartupCosts(updated);
    }
  };

  const addStartupCost = () => {
    setStartupCosts([...startupCosts, { item: 'New Expense Item', cost: 1000 }]);
  };

  const deleteStartupCost = (index: number) => {
    setStartupCosts(startupCosts.filter((_, idx) => idx !== index));
  };

  // Projections Helpers
  const updateRevenueProjection = (index: number, value: number | '') => {
    const updated = [...revenueProjections];
    updated[index] = value;
    setRevenueProjections(updated);
  };

  const updateExpenseForecast = (index: number, value: number | '') => {
    const updated = [...expenseForecasts];
    updated[index] = value;
    setExpenseForecasts(updated);
  };

  // Break Even Helpers
  const updateBreakEvenField = (field: string, value: number) => {
    setBreakEven({
      ...breakEven,
      [field]: value
    });
  };

  const handleGenerateFinance = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Generating customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    if (!financeFocus) return;
    setIsGeneratingFinance(true);
    setFinanceError('');
    setFinanceLogId('');
    setFinanceSaveStatus('idle');
    setFinanceSaveMessage('');
    try {
      const res = await generateCustomFinance(workspace.id, financeFocus);
      if (res.success && res.data) {
        setStartupCosts(res.data.startup_costs || []);
        setRevenueProjections(safeParseProjections(res.data.revenue_projections));
        setExpenseForecasts(safeParseProjections(res.data.expense_forecasts));
        setBreakEven(res.data.break_even_analysis || { fixed_monthly_overhead: 0, revenue_per_unit: 0, margin_percentage: 0 });
        if (res.circuitBreakerActive) setCircuitBreakerActive(true);
      } else {
        setFinanceError(res.error || 'Failed to generate financial model.');
        setFinanceLogId(res.logId || '');
      }
    } catch (err: any) {
      console.error(err);
      setFinanceError(err.message || 'Error occurred during financial generation.');
      setFinanceLogId(`ERR-FINANCE-${Date.now()}`);
    } finally {
      setIsGeneratingFinance(false);
    }
  };

  const handleSaveFinance = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Saving customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    setIsSavingFinance(true);
    setFinanceSaveStatus('idle');
    setFinanceSaveMessage('');
    try {
      const res = await saveWorkspaceFinance(workspace.id, {
        startup_costs: startupCosts,
        revenue_projections: revenueProjections.map(v => v === '' ? 0 : v),
        expense_forecasts: expenseForecasts.map(v => v === '' ? 0 : v),
        break_even_analysis: breakEven
      });
      if (res.success) {
        setFinanceSaveStatus('success');
        setFinanceSaveMessage(res.message || 'Financial projections successfully saved!');
        setTimeout(() => setFinanceSaveStatus('idle'), 3000);
      } else {
        setFinanceSaveStatus('error');
        setFinanceSaveMessage(res.error || 'Failed to save financial projections.');
      }
    } catch (err: any) {
      console.error(err);
      setFinanceSaveStatus('error');
      setFinanceSaveMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSavingFinance(false);
    }
  };

  // Instagram Post Helpers
  const updateInstagramPost = (index: number, fields: any) => {
    const updated = [...instagramCampaigns];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fields };
      setInstagramCampaigns(updated);
    }
  };

  const addInstagramPost = () => {
    setInstagramCampaigns([...instagramCampaigns, { image_idea: 'New image visual idea', caption: 'New post caption hooks', hashtags: ['brand', 'marketing'] }]);
  };

  const deleteInstagramPost = (index: number) => {
    setInstagramCampaigns(instagramCampaigns.filter((_, idx) => idx !== index));
  };

  // LinkedIn Post Helpers
  const updateLinkedinPost = (index: number, fields: any) => {
    const updated = [...linkedinCampaigns];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fields };
      setLinkedinCampaigns(updated);
    }
  };

  const addLinkedinPost = () => {
    setLinkedinCampaigns([...linkedinCampaigns, { hook: 'New professional hook line', body: 'New industry/insight body content' }]);
  };

  const deleteLinkedinPost = (index: number) => {
    setLinkedinCampaigns(linkedinCampaigns.filter((_, idx) => idx !== index));
  };

  // Email Helpers
  const updateEmailSequence = (index: number, fields: any) => {
    const updated = [...emailSequences];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fields };
      setEmailSequences(updated);
    }
  };

  const addEmailSequence = () => {
    setEmailSequences([...emailSequences, { subject: 'New subject line', body: 'New email body details', trigger_day: 1 }]);
  };

  const deleteEmailSequence = (index: number) => {
    setEmailSequences(emailSequences.filter((_, idx) => idx !== index));
  };

  // Ad Copy Helpers
  const updateAdCopyText = (platform: string, index: number, value: string) => {
    const updated = { ...adCopy };
    if (!updated[platform]) updated[platform] = [];
    updated[platform][index] = value;
    setAdCopy(updated);
  };

  const addAdCopy = (platform: string) => {
    const updated = { ...adCopy };
    if (!updated[platform]) updated[platform] = [];
    updated[platform].push('New ad copy text');
    setAdCopy(updated);
  };

  const deleteAdCopy = (platform: string, index: number) => {
    const updated = { ...adCopy };
    if (updated[platform]) {
      updated[platform] = updated[platform].filter((_: any, idx: number) => idx !== index);
      setAdCopy(updated);
    }
  };

  // Content Calendar Helpers
  const updateContentCalendarEvent = (index: number, fields: any) => {
    const updated = [...contentCalendar];
    if (updated[index]) {
      updated[index] = { ...updated[index], ...fields };
      setContentCalendar(updated);
    }
  };

  const addContentCalendarEvent = () => {
    setContentCalendar([...contentCalendar, { day: 1, platform: 'instagram', topic: 'New announcement topic' }]);
  };

  const deleteContentCalendarEvent = (index: number) => {
    setContentCalendar(contentCalendar.filter((_, idx) => idx !== index));
  };

  // Action handlers
  const handleGenerateMarketing = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Generating customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    if (!marketingFocus) return;
    setIsGeneratingMarketing(true);
    setMarketingError('');
    setMarketingLogId('');
    setMarketingSaveStatus('idle');
    setMarketingSaveMessage('');
    try {
      const res = await generateCustomMarketing(workspace.id, marketingFocus);
      if (res.success && res.data) {
        setInstagramCampaigns(res.data.instagram_campaigns || []);
        setLinkedinCampaigns(res.data.linkedin_campaigns || []);
        setEmailSequences(res.data.email_sequences || []);
        setAdCopy(res.data.ad_copy || { google: [], meta: [], linkedin: [] });
        setContentCalendar(res.data.content_calendar || []);
        if (res.circuitBreakerActive) setCircuitBreakerActive(true);
      } else {
        setMarketingError(res.error || 'Failed to generate marketing plan.');
        setMarketingLogId(res.logId || '');
      }
    } catch (err: any) {
      console.error(err);
      setMarketingError(err.message || 'Error occurred during marketing generation.');
      setMarketingLogId(`ERR-MARKETING-${Date.now()}`);
    } finally {
      setIsGeneratingMarketing(false);
    }
  };

  const handleSaveMarketing = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Saving customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    setIsSavingMarketing(true);
    setMarketingSaveStatus('idle');
    setMarketingSaveMessage('');
    try {
      const res = await saveWorkspaceMarketing(workspace.id, {
        instagram_campaigns: instagramCampaigns,
        linkedin_campaigns: linkedinCampaigns,
        email_sequences: emailSequences,
        ad_copy: adCopy,
        content_calendar: contentCalendar
      });
      if (res.success) {
        setMarketingSaveStatus('success');
        setMarketingSaveMessage(res.message || 'Marketing plan successfully saved!');
        setTimeout(() => setMarketingSaveStatus('idle'), 3000);
      } else {
        setMarketingSaveStatus('error');
        setMarketingSaveMessage(res.error || 'Failed to save marketing plan.');
      }
    } catch (err: any) {
      console.error(err);
      setMarketingSaveStatus('error');
      setMarketingSaveMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSavingMarketing(false);
    }
  };

  // Initial Sync from branding DB if present
  useState(() => {
    if (branding?.brand_names && namesPool.length === 0) setNamesPool(branding.brand_names);
    if (branding?.slogans && taglinesPool.length === 0) setTaglinesPool(branding.slogans);
    if (branding?.logo_prompts && logoPromptsPool.length === 0) setLogoPromptsPool(branding.logo_prompts);
  });

  const handleGenerateNames = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Generating customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    if (!nameKeywords) return;
    setIsGeneratingNames(true);
    setNamesError('');
    setNamesLogId('');
    try {
      const res = await generateCustomNames(nameKeywords);
      if (res.success && res.data) {
        setNamesPool(res.data);
        if (res.data[0]?.name) {
          setSelectedName(res.data[0].name);
        }
        if (res.circuitBreakerActive) setCircuitBreakerActive(true);
      } else {
        setNamesError(res.error || 'Failed to generate names.');
        setNamesLogId(res.logId || '');
      }
    } catch (err: any) {
      console.error(err);
      setNamesError(err.message || 'Error occurred during name generation.');
      setNamesLogId(`ERR-NAMES-${Date.now()}`);
    } finally {
      setIsGeneratingNames(false);
    }
  };

  const handleGenerateTaglines = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Generating customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    setIsGeneratingTaglines(true);
    setTaglinesError('');
    setTaglinesLogId('');
    try {
      const res = await generateCustomTaglines(voiceTone, workspace.description);
      if (res.success && res.data) {
        setTaglinesPool(res.data);
        setSelectedTagline(res.data[0]);
        setSelectedVoice(voiceTone);
        if (res.circuitBreakerActive) setCircuitBreakerActive(true);
      } else {
        setTaglinesError(res.error || 'Failed to generate taglines.');
        setTaglinesLogId(res.logId || '');
      }
    } catch (err: any) {
      console.error(err);
      setTaglinesError(err.message || 'Error occurred during tagline generation.');
      setTaglinesLogId(`ERR-TAGLINES-${Date.now()}`);
    } finally {
      setIsGeneratingTaglines(false);
    }
  };

  const handleGeneratePalette = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Generating customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    setIsGeneratingPalette(true);
    setPaletteError('');
    setPaletteLogId('');
    try {
      const res = await generateCustomPalette(colorVibe);
      if (res.success && res.data) {
        setSelectedPalette(res.data);
        if (res.circuitBreakerActive) setCircuitBreakerActive(true);
      } else {
        setPaletteError(res.error || 'Failed to generate palette.');
        setPaletteLogId(res.logId || '');
      }
    } catch (err: any) {
      console.error(err);
      setPaletteError(err.message || 'Error occurred during palette generation.');
      setPaletteLogId(`ERR-PALETTE-${Date.now()}`);
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  const handleGenerateLogoPrompts = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Generating customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    setIsGeneratingLogoPrompts(true);
    setLogoPromptsError('');
    setLogoPromptsLogId('');
    try {
      const res = await generateCustomLogoPrompts(logoStyle);
      if (res.success && res.data) {
        setLogoPromptsPool(res.data);
        setSelectedLogoPrompt(res.data[0]);
        if (res.circuitBreakerActive) setCircuitBreakerActive(true);
      } else {
        setLogoPromptsError(res.error || 'Failed to generate logo prompts.');
        setLogoPromptsLogId(res.logId || '');
      }
    } catch (err: any) {
      console.error(err);
      setLogoPromptsError(err.message || 'Error occurred during logo prompt generation.');
      setLogoPromptsLogId(`ERR-LOGOS-${Date.now()}`);
    } finally {
      setIsGeneratingLogoPrompts(false);
    }
  };

  const handleSaveBrandProfile = async () => {
    if (disableEdits) {
      alert(isReadOnly 
        ? "Demo Mode: Saving customized workspace assets is restricted in the public read-only Demo Workspace." 
        : "Permission Denied: You have Viewer permissions and cannot modify or generate assets in this workspace.");
      return;
    }
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');
    try {
      const res = await saveBrandProfile(workspace.id, {
        brand_name: selectedName,
        tagline: selectedTagline,
        brand_voice: selectedVoice,
        color_palette: selectedPalette,
        logo_prompt: selectedLogoPrompt
      });
      if (res.success) {
        setSaveStatus('success');
        setSaveMessage(res.message || 'Brand profile successfully saved!');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setSaveMessage(res.error || 'Failed to save brand profile.');
      }
    } catch (err: any) {
      console.error(err);
      setSaveStatus('error');
      setSaveMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workspace? This action is permanent.')) return;
    setIsDeleting(true);
    try {
      await deleteWorkspace(workspace.id);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Building2 },
    { id: 'research', name: 'Market Research', icon: BarChart3 },
    { id: 'branding', name: 'Branding Studio', icon: Palette },
    { id: 'finance', name: 'Financial Engine', icon: IndianRupee },
    { id: 'roadmap', name: 'Roadmap Planner', icon: Milestone },
    { id: 'marketing', name: 'Marketing Center', icon: Megaphone },
    { id: 'pitchdeck', name: 'Pitch Deck', icon: Presentation },
    { id: 'landingpage', name: 'Landing Page', icon: Globe },
    { id: 'knowledge', name: 'Knowledge Base', icon: BookOpen },
    { id: 'memory', name: 'Memory & Search', icon: History },
    { id: 'health', name: 'Venture Health', icon: Activity },
    { id: 'team', name: 'Team OS', icon: Users },
  ] as const;

  const renderSidebarContent = (collapsed: boolean, showClose = false, onClose?: () => void, id?: string) => {
    return (
      <aside id={id} className={`h-full bg-white flex flex-col justify-between p-4 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          {/* Logo / Workspace Selector Header */}
          <div className={`flex items-center px-1.5 min-w-0 ${collapsed ? 'justify-center w-full' : 'justify-between'}`}>
            {collapsed ? (
              /* Clickable Shield Logo to expand sidebar on Desktop */
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex p-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-white shadow-sm shrink-0 transition-colors"
                title="Expand sidebar"
              >
                <Shield className="w-4 h-4" />
              </button>
            ) : (
              /* Standard logo + text when expanded */
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-slate-900 rounded-xl text-white shadow-sm shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0 animate-fadeIn">
                  <h3 className="text-xs font-bold text-slate-800 truncate">{workspace.name}</h3>
                  <p className="text-[9px] text-slate-500 font-medium truncate uppercase tracking-wider font-semibold">{workspace.stage} Stage</p>
                </div>
              </div>
            )}

            {/* Collapse/Expand Toggle Button (only when expanded on Desktop) */}
            {!collapsed && !showClose && (
              <button 
                onClick={toggleSidebar} 
                className="hidden lg:flex p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                title="Collapse sidebar"
              >
                <Menu className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Close Button (only on Mobile/Tablet drawers when expanded) */}
            {!collapsed && showClose && onClose && (
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                title="Close drawer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Navigation Links Grouped by Folder OS IA */}
          <nav className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
            {navGroups.map((group, gIdx) => {
              const isFolder = !!group.name;
              const isExpanded = !isFolder || expandedFolders[group.name];

              return (
                <div key={gIdx} className="space-y-1">
                  {isFolder && !collapsed && (
                    <button
                      onClick={() => toggleFolder(group.name)}
                      className="w-full flex items-center justify-between px-3 py-1 mb-1 text-slate-600 hover:text-slate-800 transition-colors text-left"
                    >
                      <span className="text-[9px] font-extrabold uppercase tracking-wider">{group.name}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                    </button>
                  )}
                  {isFolder && collapsed && (
                    <div className="border-t border-slate-100 my-2" />
                  )}
                  {(isExpanded || collapsed) && (
                    <div className="space-y-0.5">
                      {group.items.map((item: any) => {
                        const Icon = item.icon;
                        const isTabActive = activeTab === item.id || 
                          (item.id === 'validation' && activeTab === 'research') ||
                          (item.id === 'documents' && activeTab === 'knowledge') ||
                          (item.id === 'team-members' && activeTab === 'team' && collabSubTab === 'members') ||
                          (item.id === 'team-discussions' && activeTab === 'team' && collabSubTab === 'discussions') ||
                          (item.id === 'team-versions' && activeTab === 'team' && collabSubTab === 'versions') ||
                          (item.id === 'team-timeline' && activeTab === 'team' && collabSubTab === 'timeline');

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (item.action) {
                                item.action();
                              } else {
                                setActiveTab(item.id as any);
                              }
                              if (onClose) onClose(); // Auto close drawer
                            }}
                            title={collapsed ? item.name : undefined}
                            className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                              isTabActive
                                ? 'bg-slate-900 text-white font-bold shadow-sm'
                                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                            } ${collapsed ? 'justify-center' : 'justify-between'}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 shrink-0" />
                              {!collapsed && <span className="animate-fadeIn truncate">{item.name}</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer info or profile */}
        <div className="pt-4 border-t border-slate-150 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {currentUserProfile?.avatar_url ? (
              <img
                src={currentUserProfile.avatar_url}
                alt={currentUserProfile.full_name || 'User'}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-250"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-250 flex items-center justify-center text-[10px] font-bold text-slate-700 uppercase shrink-0">
                {getInitials(currentUserProfile?.full_name, currentUserProfile?.email)}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 animate-fadeIn">
                <p className="text-[10px] font-bold text-slate-700 truncate">
                  {currentUserProfile?.full_name || currentUserProfile?.email || 'Workspace Owner'}
                </p>
                <p className="text-[8px] text-slate-500 truncate uppercase tracking-wider font-semibold">{userRole}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#FAFAFA] flex text-slate-800 relative animate-fadeIn">
      {/* A. Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 border-r border-slate-200/80 sticky top-[80px] h-[calc(100vh-100px)] self-start">
        {renderSidebarContent(isSidebarCollapsed, false, undefined, "tour-step-sidebar")}
      </div>

      {/* B. Tablet Slide-Over Drawer */}
      {isTabletOpen && (
        <div className="hidden md:flex lg:hidden fixed inset-0 z-50 animate-fadeIn">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsTabletOpen(false)} 
            className="absolute inset-0 bg-black/30 backdrop-blur-xs"
          />
          {/* Drawer container */}
          <div className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl animate-slideRight">
            {renderSidebarContent(false, true, () => setIsTabletOpen(false))}
          </div>
        </div>
      )}

      {/* C. Mobile Slide-Out Drawer */}
      {isMobileOpen && (
        <div className="flex md:hidden fixed inset-0 z-50 animate-fadeIn">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsMobileOpen(false)} 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          {/* Drawer container */}
          <div className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl animate-slideRight">
            {renderSidebarContent(false, true, () => setIsMobileOpen(false))}
          </div>
        </div>
      )}

      {/* 2. Central Column: Main content + Header */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#FAFAFA]">
        {/* Persistent Workspace Header */}
        <header id="tour-step-header" className="border-b border-slate-200/80 bg-white px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Tablet/Mobile Hamburger Trigger */}
            <button 
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setIsMobileOpen(true);
                } else {
                  setIsTabletOpen(true);
                }
              }}
              className="lg:hidden p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors mr-1"
              title="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace OS</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              {activeTab === 'research' || activeTab === 'validation' ? 'Validation' : activeTab === 'team' ? 'Team OS' : activeTab}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Circular Readiness Gauge */}
            {healthScoreData && (
              <div id="tour-step-readiness-gauge" className="flex items-center gap-2 border-r border-slate-200 pr-4">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Venture Readiness</span>
                <div className="relative w-7 h-7 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-full font-bold text-[10px] text-emerald-600">
                  {healthScoreData.score || 0}%
                </div>
              </div>
            )}

            {/* Comment Drawer Toggle */}
            <button
              onClick={() => setIsCommentDrawerOpen(!isCommentDrawerOpen)}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                isCommentDrawerOpen 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                  : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-bold">
                {commentsList.filter(c => c.resource_type === currentResourceType).length}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto space-y-6">
          {circuitBreakerActive && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-amber-800 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Primary LLM service is experiencing high latency/downtime. StartupOS has automatically switched to the high-performance fallback model (<code className="px-1 py-0.5 bg-amber-100 rounded text-amber-900 font-mono text-[10px]">google/gemini-2.5-flash-lite</code>) to maintain reliability.</span>
              </div>
              <button 
                onClick={() => setCircuitBreakerActive(false)}
                className="text-[10px] text-amber-700 hover:text-amber-900 font-bold uppercase tracking-wider shrink-0 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
          {isReadOnly && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-slate-800 shadow-sm bg-white">
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 font-bold uppercase text-[9px] tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Demo Workspace
                </span>
                <span>You are viewing a read-only portfolio demo of <strong>EcoThread India</strong>. File uploads, edits, and custom AI runs are disabled.</span>
              </div>
              <Link href="/signup" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shrink-0">
                Create Account
              </Link>
            </div>
          )}

          {!isReadOnly && userRole === 'viewer' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 shadow-sm">
              <Shield className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs font-semibold">
                <span>You have joined this workspace as a <strong>Viewer</strong>. All editing, document uploading, co-founder chats, and settings modifications are locked. Contact the owner to request Editor or Admin privileges.</span>
              </div>
            </div>
          )}

          {planType === 'free' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-slate-800 shadow-sm bg-white">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Zap className={`w-4 h-4 shrink-0 ${isGenerationBlocked ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>AI Generations Quota: <strong>{generationCount || 0} of {generationLimit || 10}</strong> runs used this month (Free Plan).</span>
              </div>
              {isGenerationBlocked ? (
                <Link href="/settings/billing" className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-white" />
                  Upgrade to Pro
                </Link>
              ) : (
                <Link href="/settings/billing" className="text-xs text-indigo-600 hover:text-indigo-700 font-bold transition-all">
                  Manage Billing
                </Link>
              )}
            </div>
          )}
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {isLoadingHealth ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-emerald-500" />
                Calculating Venture Metrics...
              </div>
            ) : healthScoreData ? (
              <div className="space-y-8">
                {/* 1. Workspace Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                        {workspace.stage} Stage
                      </span>
                      <span className="inline-flex px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                        {workspace.industry}
                      </span>
                    </div>
                    <h1 className="text-2xl font-heading font-extrabold tracking-tight text-slate-900 mt-1">{workspace.name}</h1>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                      ₹{parseFloat(workspace.budget || '0').toLocaleString('en-IN')} Budget • {members.length + 1} Team Members • {documents.length} Documents
                    </p>
                    <p className="text-slate-650 text-xs font-medium max-w-3xl leading-relaxed">{workspace.description}</p>
                  </div>

                  {/* Integrated circular gauge in header */}
                  <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm shrink-0">
                    <div className="relative w-16 h-16">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="#F1F5F9" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="url(#health-grad-overview)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={263.89}
                          strokeDashoffset={263.89 - (263.89 * (healthScoreData.overall || 0)) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="health-grad-overview" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#6366F1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-extrabold text-slate-805">{healthScoreData.overall || 0}%</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Venture Readiness</span>
                      <p className="text-xs font-bold text-slate-800">
                        {healthScoreData.overall || 0}/100 Completed
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium max-w-[150px]">
                        {healthScoreData.overall >= 80 
                          ? 'Exceptional strategic planning.'
                          : healthScoreData.overall >= 50
                          ? 'Solid foundation, missing assets.'
                          : 'Venture has minor validation profiles.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
                  {/* Left Column (Main Mission Control) */}
                  <div className="lg:col-span-8 space-y-8">
                    {/* 2. Recommended Actions */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Recommended Actions</h3>
                      {healthScoreData?.recommendationsDegraded && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 shadow-sm animate-fade-in">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                          <div className="text-xs font-semibold">
                            <span>AI-generated recommendations are temporarily degraded or unavailable due to a model fallback. Your core metrics and readiness checks are preserved.</span>
                          </div>
                        </div>
                      )}
                      {(() => {
                        const actions = (healthScoreData.recommendations || []).map((rec: string, idx: number) => {
                          let priority = 'Medium';
                          let impact = 'High';
                          let tabId: any = 'research';
                          let actionLabel = 'Review';
                          
                          const recLower = rec.toLowerCase();
                          if (recLower.includes('pricing') || recLower.includes('economic') || recLower.includes('financial')) {
                            priority = 'High';
                            impact = 'Critical';
                            tabId = 'finance';
                            actionLabel = 'Refine Forecast';
                          } else if (recLower.includes('competitor') || recLower.includes('competitors') || recLower.includes('matrix')) {
                            priority = 'High';
                            impact = 'High';
                            tabId = 'competitors';
                            actionLabel = 'Add Competitor';
                          } else if (recLower.includes('brand') || recLower.includes('logo') || recLower.includes('voice')) {
                            priority = 'Medium';
                            impact = 'High';
                            tabId = 'branding';
                            actionLabel = 'Branding Studio';
                          } else if (recLower.includes('marketing') || recLower.includes('campaign') || recLower.includes('social')) {
                            priority = 'Medium';
                            impact = 'High';
                            tabId = 'marketing';
                            actionLabel = 'Marketing Engine';
                          } else if (recLower.includes('pitch') || recLower.includes('slide') || recLower.includes('deck')) {
                            priority = 'High';
                            impact = 'Critical';
                            tabId = 'pitchdeck';
                            actionLabel = 'Edit Deck';
                          } else if (recLower.includes('landing') || recLower.includes('seo') || recLower.includes('storefront')) {
                            priority = 'Medium';
                            impact = 'High';
                            tabId = 'landingpage';
                            actionLabel = 'Open Customizer';
                          } else if (recLower.includes('team') || recLower.includes('invite') || recLower.includes('member')) {
                            priority = 'Low';
                            impact = 'Medium';
                            tabId = 'team';
                            actionLabel = 'Invite Members';
                          }
                          
                          return {
                            id: idx,
                            title: rec,
                            priority,
                            impact,
                            tabId,
                            actionLabel
                          };
                        });

                        if (actions.length === 0) {
                          return <p className="text-xs text-slate-400 italic px-1">All strategic actions completed successfully.</p>;
                        }

                        return (
                          <div className="space-y-3">
                            {actions.slice(0, 4).map((act: any) => (
                              <div key={act.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-slate-350 transition-all">
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                      act.priority === 'High' 
                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                        : act.priority === 'Medium'
                                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                        : 'bg-slate-50 text-slate-500 border border-slate-150'
                                    }`}>
                                      {act.priority} Priority
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Impact: {act.impact}</span>
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">{act.title}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    if (act.tabId === 'team') {
                                      setActiveTab('team');
                                      setCollabSubTab('members');
                                    } else {
                                      setActiveTab(act.tabId);
                                    }
                                  }}
                                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] shrink-0 text-center"
                                >
                                  {act.actionLabel}
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* 3. Venture Assets */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Venture Assets</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { name: 'Validation Report', tabId: 'research', status: report ? 'Active' : 'Draft', active: !!report },
                          { name: 'Competitor Analysis', tabId: 'competitors', status: competitors.length > 0 ? 'Active' : 'Draft', active: competitors.length > 0 },
                          { name: 'Brand Strategy', tabId: 'branding', status: branding && branding.brand_name ? 'Active' : 'Draft', active: !!(branding && branding.brand_name) },
                          { name: 'Marketing Plan', tabId: 'marketing', status: marketing && (marketing.instagram?.length > 0 || marketing.email_sequence?.length > 0) ? 'Active' : 'Draft', active: !!(marketing && (marketing.instagram?.length > 0 || marketing.email_sequence?.length > 0)) },
                          { name: 'Financial Forecast', tabId: 'finance', status: finance && finance.startup_costs?.length > 0 ? 'Active' : 'Draft', active: !!(finance && finance.startup_costs?.length > 0) },
                          { name: 'Pitch Deck', tabId: 'pitchdeck', status: pitchDeck && pitchDeck.slides?.length > 0 ? 'Active' : 'Draft', active: !!(pitchDeck && pitchDeck.slides?.length > 0) },
                          { name: 'Landing Page', tabId: 'landingpage', status: landingPage && landingPage.hero_title ? 'Active' : 'Draft', active: !!(landingPage && landingPage.hero_title) },
                          { name: 'Knowledge Base', tabId: 'documents', status: documents.length > 0 ? 'Active' : 'Draft', active: documents.length > 0 }
                        ].map((asset: any, aIdx: number) => (
                          <div key={aIdx} className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-all">
                            <div className="min-w-0 pr-3">
                              <h4 className="text-xs font-bold text-slate-800">{asset.name}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${asset.active ? 'bg-emerald-500' : 'bg-slate-350'}`} />
                                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">{asset.status}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (asset.tabId === 'documents') {
                                  setActiveTab('documents');
                                } else {
                                  setActiveTab(asset.tabId);
                                }
                              }}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-all"
                            >
                              Open Asset
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4. Key Metrics */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Key Metrics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Industry</span>
                          <p className="text-xs font-bold text-slate-800">{workspace.industry}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Target Market</span>
                          <p className="text-xs font-bold text-slate-850 leading-normal truncate">{workspace.target_market}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Budget Allocation</span>
                          <p className="text-xs font-bold text-slate-800">₹{parseFloat(workspace.budget || '0').toLocaleString('en-IN')}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Startup Stage</span>
                          <p className="text-xs font-bold text-slate-800 capitalize">{workspace.stage}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Documents Ingested</span>
                          <p className="text-xs font-bold text-slate-800">{documents.length} files</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">AI Generations Used</span>
                          <p className="text-xs font-bold text-slate-800">{generationCount || 0} / {generationLimit || 10} runs</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Team Members</span>
                          <p className="text-xs font-bold text-slate-800">{members.length + 1} collaborators</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Workspace Health</span>
                          <p className="text-xs font-bold text-slate-800">{healthScoreData.overall || 0}% Score</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Activity Feed) */}
                  <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-8">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Activity Feed</h3>
                    {isLoadingTimeline ? (
                      <div className="py-12 text-center text-xs text-slate-400 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading event logs...
                      </div>
                    ) : timelineEvents.length > 0 ? (
                      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-6 max-h-[550px] overflow-y-auto pr-2 scrollbar-thin">
                        {timelineEvents.slice(0, 8).map((evt, idx) => (
                          <div key={evt.id || idx} className="flex gap-3 relative">
                            {idx !== timelineEvents.slice(0, 8).length - 1 && (
                              <div className="absolute left-3.5 top-7 bottom-0 w-px bg-slate-150 -mb-6" />
                            )}
                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                              evt.event_type === 'chat'
                                ? 'bg-violet-50 border-violet-100 text-violet-600'
                                : evt.event_type === 'creation'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                            }`}>
                              {evt.event_type === 'chat' ? 'C' : evt.event_type === 'creation' ? 'W' : 'A'}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{new Date(evt.created_at || evt.timestamp).toLocaleDateString()}</p>
                              <h4 className="text-xs font-bold text-slate-800 truncate">{evt.title}</h4>
                              <p className="text-[10px] text-slate-500 leading-normal">{evt.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic px-1">No activity registered yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm">
                Failed to retrieve health metrics.
                <button onClick={fetchHealthScore} className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold mx-auto block">
                  Retry Calculation
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Market Research */}
        {activeTab === 'research' && report && (
          <div id="tour-step-validation" className="space-y-6">
            {/* Feasibility score dials */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Feasibility Score', value: report.feasibility_score, color: 'text-emerald-400', bg: 'bg-slate-100' },
                { label: 'Profitability Potential', value: report.profitability_score, color: 'text-indigo-700', bg: 'bg-slate-100' },
                { label: 'Implementation Difficulty', value: report.difficulty_score, color: 'text-amber-400', bg: 'bg-amber-50' },
              ].map((score, i) => (
                <div key={i} className="glass-panel border border-slate-200 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{score.label}</p>
                    <p className="text-slate-600 text-xs mt-1">Based on agent analysis</p>
                  </div>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${score.color} ${score.bg} border border-slate-200`}>
                    {score.value}%
                  </div>
                </div>
              ))}
            </div>

            {/* SWOT quadrant layout */}
            <div className="glass-panel border border-slate-200 p-6 rounded-3xl">
              <h3 className="text-lg font-bold text-slate-800 mb-6">SWOT Analysis Matrix</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Strengths', items: report.swot_analysis?.strengths || [], border: 'border-emerald-900/30 hover:border-emerald-500/30', badge: 'bg-slate-100 text-emerald-700' },
                  { title: 'Weaknesses', items: report.swot_analysis?.weaknesses || [], border: 'border-rose-900/30 hover:border-rose-500/30', badge: 'bg-rose-950/20 text-rose-700' },
                  { title: 'Opportunities', items: report.swot_analysis?.opportunities || [], border: 'border-violet-900/30 hover:border-violet-500/30', badge: 'bg-slate-100 text-violet-450' },
                  { title: 'Threats', items: report.swot_analysis?.threats || [], border: 'border-amber-900/30 hover:border-amber-500/30', badge: 'bg-amber-50 text-amber-450' },
                ].map((quad, index) => (
                  <div key={index} className={`p-5 rounded-2xl bg-slate-50/35 border ${quad.border} transition-all`}>
                    <h4 className="font-heading font-bold text-sm text-slate-250 mb-3 flex items-center justify-between">
                      {quad.title}
                      <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${quad.badge}`}>
                        Internal / External
                      </span>
                    </h4>
                    <ul className="space-y-1.5">
                      {quad.items.map((item: string, idx: number) => (
                        <li key={idx} className="text-slate-500 text-xs leading-relaxed flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-slate-750 rounded-full mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <InlineCommentsWidget
                workspaceId={workspace.id}
                resourceType="report"
                comments={commentsList}
                onAddComment={handleAddInlineComment}
                onDeleteComment={handleDeleteInlineComment}
                disableEdits={disableEdits}
              />
            </div>

            {/* Market Gaps & differentiation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-slate-250 mb-4">Identified Market Gaps</h3>
                <div className="flex flex-wrap gap-2">
                  {report.market_gaps?.map((gap: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-emerald-700 rounded-xl text-xs font-semibold">
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-slate-250 mb-4">Differentiation Strategy</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                  {report.differentiation_strategy}
                </p>
              </div>
            </div>

            {/* Market Demand and Competition summary text */}
            <div className="glass-panel border border-slate-200 p-6 rounded-3xl">
              <h3 className="text-lg font-bold text-slate-250 mb-3">Market Demand & Competition</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">{report.market_demand}</p>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold border-t border-slate-200 pt-4">{report.competition_summary}</p>
            </div>

          </div>
        )}

        {/* Tab 2.5: Competitors */}
        {activeTab === 'competitors' && report && (
          <div className="space-y-6">
            {competitors && competitors.length > 0 ? (
              <div id="tour-step-competitors" className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Competitor Comparison Matrix</h3>
                  <p className="text-xs text-slate-500 mt-1">Direct and indirect market competitors analyzed by StartupOS AI</p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {competitors.map((comp: any, index: number) => (
                    <div 
                      key={comp.id || index} 
                      className="p-5 rounded-2xl bg-slate-50/35 border border-slate-100 hover:border-emerald-500/20 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Header: Name, Website, Market Share */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
                          <div>
                            <h4 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-1.5">
                              {comp.name}
                              {comp.website && (
                                <a 
                                  href={comp.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-slate-500 hover:text-emerald-400 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium uppercase tracking-wider">
                              Market Competitor
                            </p>
                          </div>
                          {comp.market_share && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-indigo-700 border border-violet-900/30">
                              {comp.market_share} Share
                            </span>
                          )}
                        </div>

                        {/* Pricing info */}
                        {comp.estimated_pricing && (
                          <div className="space-y-1">
                            <span className="text-slate-550 text-[10px] font-bold uppercase tracking-wider">Estimated Pricing</span>
                            <p className="text-slate-700 text-xs font-semibold">{comp.estimated_pricing}</p>
                          </div>
                        )}

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 gap-3 pt-1">
                          <div className="space-y-1.5">
                            <span className="text-emerald-500/90 text-[10px] font-bold uppercase tracking-wider">Strengths</span>
                            <ul className="space-y-1">
                              {comp.strengths?.map((str: string, sIdx: number) => (
                                <li key={sIdx} className="text-slate-500 text-xs leading-relaxed flex items-start gap-1.5">
                                  <span className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                                  {str}
                                </li>
                              ))}
                              {(!comp.strengths || comp.strengths.length === 0) && (
                                <li className="text-slate-600 text-xs italic">No documented strengths.</li>
                              )}
                            </ul>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-rose-500/90 text-[10px] font-bold uppercase tracking-wider">Weaknesses</span>
                            <ul className="space-y-1">
                              {comp.weaknesses?.map((weak: string, wIdx: number) => (
                                <li key={wIdx} className="text-slate-500 text-xs leading-relaxed flex items-start gap-1.5">
                                  <span className="w-1 h-1 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                                  {weak}
                                </li>
                              ))}
                              {(!comp.weaknesses || comp.weaknesses.length === 0) && (
                                <li className="text-slate-600 text-xs italic">No documented weaknesses.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Differentiation Box */}
                      {comp.differentiation && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="p-3 bg-emerald-950/10 border border-emerald-900/10 rounded-xl">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Our Differentiation</span>
                              <button
                                onClick={() => handleCopy(comp.differentiation, `diff-${index}`)}
                                className="text-slate-500 hover:text-slate-700 transition-colors p-0.5"
                              >
                                {copiedText === `diff-${index}` ? (
                                  <Check className="w-3 h-3 text-emerald-700" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <p className="text-slate-500 text-xs leading-normal">
                              {comp.differentiation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 glass-panel border border-slate-200 rounded-3xl bg-white">
                No competitors analyzed. Run AI validator to generate market research.
              </div>
            )}
          </div>
        )}        {activeTab === 'branding' && branding && (
          <div id="tour-step-branding" className="flex flex-col xl:flex-row gap-8 items-start w-full">
            {/* Left: Customizers Panel */}
            <div className="flex-1 space-y-6 w-full">
              {/* 1. Name Generator Card */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-lg font-bold text-slate-800">Interactive Brand Name Generator</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Input descriptive keywords to generate startup name suggestions. Click on any generated card to select it as your primary brand name.
                </p>
                 <div className="flex gap-3">
                  <input
                    type="text"
                    value={nameKeywords}
                    onChange={(e) => setNameKeywords(e.target.value)}
                    placeholder="e.g. bio clothing, green apparel, campus streetwear"
                    disabled={disableEdits}
                    className="flex-1 bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-500 focus:outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleGenerateNames}
                    disabled={isGeneratingNames || !nameKeywords || disableEdits || isGenerationBlocked}
                    title={disableEdits ? "Viewer mode: editing disabled" : isGenerationBlocked ? "AI generations limit reached" : ""}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isGeneratingNames ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Regenerate'}
                  </button>
                </div>
                {renderAiErrorAlert(namesError, namesLogId, handleGenerateNames, () => setNamesError(''))}

                {namesPool.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {namesPool.map((bn: any, i: number) => {
                      const isSelected = selectedName === bn.name;
                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (!disableEdits) {
                              setSelectedName(bn.name);
                            }
                          }}
                          className={`p-4 rounded-xl border transition-all ${
                            disableEdits ? 'cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-slate-900 shadow-md shadow-indigo-950/5'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs">{bn.name}</span>
                            {isSelected && <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700">Selected</span>}
                          </div>
                          <p className={`text-[10px] leading-normal ${isSelected ? 'text-slate-700' : 'text-slate-500'}`}>{bn.justification}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Tagline & Voice Selector */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-lg font-bold text-slate-800">Slogan & Brand Voice Creator</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select a voice tone parameters for your tagline. Click on any tagline option to lock it as your slogan.
                </p>
                <div className="flex gap-3 items-center">
                  <select
                    value={voiceTone}
                    onChange={(e) => setVoiceTone(e.target.value)}
                    disabled={disableEdits}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-700 text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="Eco-conscious & Vibrant">Eco-conscious & Vibrant</option>
                    <option value="Witty & Campus-trendy">Witty & Campus-trendy</option>
                    <option value="Sleek, Premium & Minimalist">Sleek, Premium & Minimalist</option>
                    <option value="Bold, Rebel & Disruptive">Bold, Rebel & Disruptive</option>
                    <option value="Professional, Trustworthy & Corporate">Professional, Trustworthy & Corporate</option>
                  </select>
                  <button
                    onClick={handleGenerateTaglines}
                    disabled={isGeneratingTaglines || disableEdits || isGenerationBlocked}
                    title={disableEdits ? "Viewer mode: editing disabled" : isGenerationBlocked ? "AI generations limit reached" : ""}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isGeneratingTaglines ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Create Slogans'}
                  </button>
                </div>
                {renderAiErrorAlert(taglinesError, taglinesLogId, handleGenerateTaglines, () => setTaglinesError(''))}

                {taglinesPool.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {taglinesPool.map((slogan: string, i: number) => {
                      const isSelected = selectedTagline === slogan;
                      return (
                        <div
                          key={i}
                          onClick={() => setSelectedTagline(slogan)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center text-xs ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-slate-900 shadow-md shadow-indigo-950/5'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-750'
                          }`}
                        >
                          <span className="italic font-medium">&quot;{slogan}&quot;</span>
                          {isSelected && <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 shrink-0">Selected</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Color Palette vibe picker */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-lg font-bold text-slate-800">Color Palette Spectrum</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select a visual style direction to regenerate a custom color combination.
                </p>
                <div className="flex gap-3 items-center">
                  <select
                    value={colorVibe}
                    onChange={(e) => setColorVibe(e.target.value)}
                    disabled={disableEdits}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-700 text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="Nature / Sustainable Green / Earth">Nature / Sustainable Green / Earth</option>
                    <option value="Neon Cyberpunk / Electric Blue & Purple">Neon Cyberpunk / Electric Blue & Purple</option>
                    <option value="Minimalist / Dark Space / Charcoal">Minimalist / Dark Space / Charcoal</option>
                    <option value="Warm / Retro Orange & Cream">Warm / Retro Orange & Cream</option>
                    <option value="Modern Tech / Royal Indigo & Electric Blue">Modern Tech / Royal Indigo & Electric Blue</option>
                  </select>
                  <button
                    onClick={handleGeneratePalette}
                    disabled={isGeneratingPalette || disableEdits || isGenerationBlocked}
                    title={disableEdits ? "Viewer mode: editing disabled" : isGenerationBlocked ? "AI generations limit reached" : ""}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPalette ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Generate Palette'}
                  </button>
                </div>
                {renderAiErrorAlert(paletteError, paletteLogId, handleGeneratePalette, () => setPaletteError(''))}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { label: 'Primary', hex: selectedPalette.primary },
                    { label: 'Secondary', hex: selectedPalette.secondary },
                    { label: 'Accent', hex: selectedPalette.accent },
                    { label: 'Background', hex: selectedPalette.background },
                  ].map((color, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl border border-slate-855 mb-2 shadow-inner" style={{ backgroundColor: color.hex }} />
                      <span className="text-[10px] font-bold text-slate-500">{color.label}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">{color.hex}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Logo Prompt builder */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-lg font-bold text-slate-800">AI Logo Generation Prompt Builder</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose a logo style preset. Select a prompt to save it to your brand profile for copy-pasting to Midjourney/DALL-E.
                </p>
                <div className="flex gap-3 items-center">
                  <select
                    value={logoStyle}
                    onChange={(e) => setLogoStyle(e.target.value)}
                    disabled={disableEdits}
                    className="flex-1 bg-slate-50 border border-slate-855 rounded-xl px-4 py-2.5 text-slate-700 text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="Minimalist geometric outline vector logo">Minimalist geometric outline vector logo</option>
                    <option value="Abstract mascot emblem in high-end vector graphics">Abstract mascot emblem in high-end vector graphics</option>
                    <option value="Vintage typographic lettering signet logo style">Vintage typographic lettering signet logo style</option>
                    <option value="Modern corporate badge design, sleek gradient outlines">Modern corporate badge design, sleek gradient outlines</option>
                  </select>
                  <button
                    onClick={handleGenerateLogoPrompts}
                    disabled={isGeneratingLogoPrompts || disableEdits || isGenerationBlocked}
                    title={disableEdits ? "Viewer mode: editing disabled" : isGenerationBlocked ? "AI generations limit reached" : ""}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isGeneratingLogoPrompts ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Create Prompts'}
                  </button>
                </div>
                {renderAiErrorAlert(logoPromptsError, logoPromptsLogId, handleGenerateLogoPrompts, () => setLogoPromptsError(''))}

                {logoPromptsPool.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {logoPromptsPool.map((prompt: string, i: number) => {
                      const isSelected = selectedLogoPrompt === prompt;
                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (!disableEdits) {
                              setSelectedLogoPrompt(prompt);
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all ${
                            disableEdits ? 'cursor-not-allowed' : 'cursor-pointer'
                          } flex justify-between items-center text-xs gap-3 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-slate-900 shadow-md shadow-indigo-950/5'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-750'
                          }`}
                        >
                          <span className="leading-relaxed font-medium">{prompt}</span>
                          {isSelected && <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 shrink-0">Selected</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Identity Guideline Card Preview (Sticky) */}
            <div className="w-full xl:w-96 shrink-0 xl:sticky xl:top-24 space-y-6">
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl relative overflow-hidden bg-white">
                {/* Visual guideline header design */}
                <div className="h-2 w-full absolute top-0 left-0 flex">
                  <div className="flex-1" style={{ backgroundColor: selectedPalette.primary }} />
                  <div className="flex-1" style={{ backgroundColor: selectedPalette.secondary }} />
                  <div className="flex-1" style={{ backgroundColor: selectedPalette.accent }} />
                  <div className="flex-1" style={{ backgroundColor: selectedPalette.background }} />
                </div>

                <div className="pt-4 space-y-6">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Active Brand Identity</span>
                    <h2 className="text-2xl font-heading font-bold tracking-tight mt-1 transition-all" style={{ color: selectedPalette.primary || '#FFF' }}>
                      {selectedName || 'Untitled Brand'}
                    </h2>
                  </div>

                  {selectedTagline && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Slogan</span>
                      <p className="text-xs italic text-slate-700 leading-normal">
                        &quot;{selectedTagline}&quot;
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Tone & Brand Voice</span>
                    <div>
                      <span className="inline-flex px-2 py-0.5 bg-slate-50 border border-slate-100 text-emerald-400 font-semibold text-[10px] rounded-lg">
                        {selectedVoice}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Color Spectrum</span>
                    <div className="flex gap-2">
                      {[
                        { name: 'Primary', hex: selectedPalette.primary },
                        { name: 'Secondary', hex: selectedPalette.secondary },
                        { name: 'Accent', hex: selectedPalette.accent },
                        { name: 'Bg', hex: selectedPalette.background }
                      ].map((item, key) => (
                        <div key={key} className="w-8 h-8 rounded-full border border-slate-200 shadow-inner cursor-help" style={{ backgroundColor: item.hex }} title={`${item.name}: ${item.hex}`} />
                      ))}
                    </div>
                  </div>

                  {selectedLogoPrompt && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Logo Design prompt</span>
                      <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-3 bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 border-dashed">
                        {selectedLogoPrompt}
                      </p>
                    </div>
                  )}

                  {saveStatus !== 'idle' && (
                    <div className={`p-3 rounded-xl border text-xs leading-normal ${
                      saveStatus === 'success' ? 'bg-slate-100 border-emerald-900/30 text-emerald-400' : 'bg-red-50 border-red-900/30 text-red-405'
                    }`}>
                      {saveMessage}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200">
                    <button
                      onClick={handleSaveBrandProfile}
                      disabled={isSaving || disableEdits}
                      title={disableEdits ? "Viewer mode: editing disabled" : ""}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Brand Profile
                        </>
                      )}
                    </button>
                  </div>
                  <InlineCommentsWidget
                    workspaceId={workspace.id}
                    resourceType="branding"
                    comments={commentsList}
                    onAddComment={handleAddInlineComment}
                    onDeleteComment={handleDeleteInlineComment}
                    disableEdits={disableEdits}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Financial Engine */}
        {activeTab === 'finance' && finance && (() => {
          const chartData = Array.from({ length: 12 }, (_, i) => {
            const revenue = revenueProjections[i] || 0;
            const expense = expenseForecasts[i] || 0;
            const profit = revenue - expense;
            return {
              name: `M${i + 1}`,
              Revenue: revenue,
              Expense: expense,
              Profit: profit
            };
          });

          let runningCumulative = 0;
          const cumulativeData = chartData.map((data) => {
            runningCumulative += data.Profit;
            return {
              name: data.name,
              CumulativeProfit: runningCumulative
            };
          });

          return (
            <div id="tour-step-finance" className="flex flex-col xl:flex-row gap-8 items-start w-full">
              {/* Left: Customizers and Grid Editors */}
              <div className="flex-1 space-y-6 w-full">
                {/* 1. Customizer Assumptions Card */}
                <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-lg font-bold text-slate-800">Interactive Financial Customizer</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Input specific strategic parameters or investment targets (e.g. &quot;Focus on organic social distribution only&quot; or &quot;Increase initial production batch inventory&quot;) to recalculate and regenerate forecast models.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={financeFocus}
                      onChange={(e) => setFinanceFocus(e.target.value)}
                      placeholder="e.g. Bootstrapped with ₹20,000, high campus sales focus, hire a delivery runner Month 2"
                      disabled={disableEdits}
                      className="flex-1 bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-500 focus:outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleGenerateFinance}
                      disabled={isGeneratingFinance || !financeFocus || disableEdits || isGenerationBlocked}
                      title={disableEdits ? "Viewer mode: editing disabled" : isGenerationBlocked ? "AI generations limit reached" : ""}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isGeneratingFinance ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Regenerate'}
                    </button>
                  </div>
                  {renderAiErrorAlert(financeError, financeLogId, handleGenerateFinance, () => setFinanceError(''))}
                </div>

                {/* 2. Startup Costs Editor */}
                <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Startup Launch Costs</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Customize one-time launch and setup expenses</p>
                    </div>
                    <button
                      onClick={addStartupCost}
                      disabled={disableEdits}
                      title={disableEdits ? "Viewer mode: editing disabled" : ""}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-700 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Cost Item
                    </button>
                  </div>

                  {startupCosts.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">No startup costs configured.</p>
                  ) : (
                    <div className="space-y-3">
                      {startupCosts.map((cost: any, idx: number) => (
                        <div key={idx} className="flex gap-3 items-center p-3 bg-slate-50/30 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                          <input
                            type="text"
                            value={cost.item || ''}
                            onChange={(e) => updateStartupCost(idx, { item: e.target.value })}
                            disabled={disableEdits}
                            className="flex-1 bg-transparent border-none p-0 text-xs text-slate-800 focus:outline-none focus:ring-0 disabled:opacity-75 disabled:cursor-not-allowed"
                            placeholder="Cost item name"
                          />
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 text-xs">₹</span>
                            <input
                              type="number"
                              value={cost.cost || 0}
                              onChange={(e) => updateStartupCost(idx, { cost: parseFloat(e.target.value) || 0 })}
                              disabled={disableEdits}
                              className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-right text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                          <button
                            onClick={() => deleteStartupCost(idx)}
                            disabled={disableEdits}
                            className="text-slate-650 hover:text-red-400 p-1 transition-colors shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                            title="Delete cost"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. 12-Month Projections Matrix */}
                <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">12-Month Profit & Loss Grid</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Edit monthly revenue projections and operating expense forecasts</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-700 font-bold uppercase tracking-wider">
                          <th className="py-2.5 w-24">Month</th>
                          <th className="py-2.5">Projected Revenue (INR)</th>
                          <th className="py-2.5">Operating Expenses (INR)</th>
                          <th className="py-2.5 w-24 text-right">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {Array.from({ length: 12 }).map((_, idx) => {
                          const rev = revenueProjections[idx] === '' ? '' : (revenueProjections[idx] || 0);
                          const exp = expenseForecasts[idx] === '' ? '' : (expenseForecasts[idx] || 0);
                          const revVal = typeof rev === 'number' ? rev : 0;
                          const expVal = typeof exp === 'number' ? exp : 0;
                          const net = revVal - expVal;
                          return (
                            <tr key={idx} className="text-slate-700 text-xs">
                              <td className="py-2.5 font-bold text-slate-600">Month {idx + 1}</td>
                              <td className="py-2 pr-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-600 text-xs">₹</span>
                                  <input
                                    type="number"
                                    value={rev}
                                    onChange={(e) => updateRevenueProjection(idx, e.target.value === '' ? '' : (parseFloat(e.target.value) || 0))}
                                    disabled={disableEdits}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                                  />
                                </div>
                              </td>
                              <td className="py-2 pr-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-600 text-xs">₹</span>
                                  <input
                                    type="number"
                                    value={exp}
                                    onChange={(e) => updateExpenseForecast(idx, e.target.value === '' ? '' : (parseFloat(e.target.value) || 0))}
                                    disabled={disableEdits}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                                  />
                                </div>
                              </td>
                              <td className={`py-2.5 text-right font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                ₹{net.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <InlineCommentsWidget
                    workspaceId={workspace.id}
                    resourceType="finance"
                    comments={commentsList}
                    onAddComment={handleAddInlineComment}
                    onDeleteComment={handleDeleteInlineComment}
                    disableEdits={disableEdits}
                  />
                </div>

                {/* 4. Break Even analysis editor */}
                <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Break-Even Parameters</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tweak pricing assumptions and fixed overheads</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider font-sans">Fixed Monthly Overhead</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-xs">₹</span>
                        <input
                          type="number"
                          value={breakEven.fixed_monthly_overhead || 0}
                          onChange={(e) => updateBreakEvenField('fixed_monthly_overhead', parseFloat(e.target.value) || 0)}
                          disabled={disableEdits}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider font-sans">Estimated Price / Unit</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-xs">₹</span>
                        <input
                          type="number"
                          value={breakEven.revenue_per_unit || 0}
                          onChange={(e) => updateBreakEvenField('revenue_per_unit', parseFloat(e.target.value) || 0)}
                          disabled={disableEdits}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider font-sans">Estimated Margin (%)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={breakEven.margin_percentage || 0}
                          onChange={(e) => updateBreakEvenField('margin_percentage', parseFloat(e.target.value) || 0)}
                          disabled={disableEdits}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                        <span className="text-slate-500 text-xs">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Charts & Commit Actions Panel */}
              <div className="w-full xl:w-[420px] shrink-0 xl:sticky xl:top-24 space-y-6">
                {/* Financial Stats Summary Card */}
                <div className="glass-panel border border-slate-200 p-6 rounded-3xl relative overflow-hidden bg-slate-50 space-y-6">
                  <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500" />
                  
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-sans">Strategic Outlook</span>
                    <h2 className="text-2xl font-heading font-bold tracking-tight text-white mt-1">Financial Forecast</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-200 py-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-700 font-bold uppercase tracking-wider">Startup Launch Costs</span>
                      <p className="text-sm font-bold text-slate-800">
                        ₹{startupCosts.reduce((sum, cost) => sum + (cost.cost || 0), 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-700 font-bold uppercase tracking-wider">Available Budget</span>
                      <p className="text-sm font-bold text-slate-500">
                        ₹{parseFloat(workspace.budget).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-700 font-bold uppercase tracking-wider">Annual Projected Revenue</span>
                      <p className="text-sm font-bold text-emerald-700">
                        ₹{revenueProjections.reduce((sum: number, rev): number => sum + (typeof rev === 'number' ? rev : 0), 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-700 font-bold uppercase tracking-wider">Annual Net Profit</span>
                      <p className={`text-sm font-bold ${
                        (revenueProjections.reduce((sum: number, rev): number => sum + (typeof rev === 'number' ? rev : 0), 0) - expenseForecasts.reduce((sum: number, exp): number => sum + (typeof exp === 'number' ? exp : 0), 0)) >= 0 
                          ? 'text-indigo-400' 
                          : 'text-rose-455'
                      }`}>
                        ₹{(revenueProjections.reduce((sum: number, rev): number => sum + (typeof rev === 'number' ? rev : 0), 0) - expenseForecasts.reduce((sum: number, exp): number => sum + (typeof exp === 'number' ? exp : 0), 0)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Professional Recharts area/bar charts */}
                  {isClient && (
                    <div className="space-y-6">
                      {/* 1. Profit & Loss comparison Area Chart */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Monthly P&L Comparison</span>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
                                </linearGradient>
                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.01}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                              <XAxis dataKey="name" stroke="#6B7280" fontSize={8} tickLine={false} />
                              <YAxis stroke="#6B7280" fontSize={8} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px' }}
                                labelStyle={{ color: '#4B5563', fontSize: '10px', fontWeight: 'bold' }}
                                itemStyle={{ fontSize: '10px' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '8px', paddingTop: '5px' }} />
                              <Area type="monotone" dataKey="Revenue" stroke="#111827" fillOpacity={1} fill="url(#colorRev)" strokeWidth={1.5} />
                              <Area type="monotone" dataKey="Expense" stroke="#9CA3AF" fillOpacity={1} fill="url(#colorExp)" strokeWidth={1.5} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* 2. Cumulative Profit Chart (illustration of break-even) */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Cumulative Net Profit Trend</span>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cumulativeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                              <XAxis dataKey="name" stroke="#6B7280" fontSize={8} tickLine={false} />
                              <YAxis stroke="#6B7280" fontSize={8} tickLine={false} axisLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '12px' }}
                                labelStyle={{ color: '#4B5563', fontSize: '10px', fontWeight: 'bold' }}
                                itemStyle={{ fontSize: '10px' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '8px', paddingTop: '5px' }} />
                              <Bar dataKey="CumulativeProfit" fill="#111827" radius={[4, 4, 0, 0]} name="Cumulative Net" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {financeSaveStatus !== 'idle' && (
                    <div className={`p-3 rounded-xl border text-xs leading-normal ${
                      financeSaveStatus === 'success' ? 'bg-slate-100 border-emerald-900/30 text-emerald-700' : 'bg-red-50 border-red-900/30 text-red-405'
                    }`}>
                      {financeSaveMessage}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={handleSaveFinance}
                      disabled={isSavingFinance || disableEdits}
                      title={disableEdits ? "Viewer mode: editing disabled" : ""}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSavingFinance ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Projections
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline Comments widget for Finance */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Financial Notes</h3>
                  <p className="text-slate-450 text-[10px] mt-0.5 font-medium leading-normal">Discussion thread for financial projections.</p>
                </div>
                <InlineCommentsWidget
                  workspaceId={workspace.id}
                  resourceType="finance"
                  comments={commentsList}
                  onAddComment={handleAddInlineComment}
                  onDeleteComment={handleDeleteInlineComment}
                  disableEdits={disableEdits}
                />
              </div>
            </div>
          );
        })()}

        {/* Tab 5: Roadmap Planner */}
        {activeTab === 'roadmap' && (
          <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
            {/* Left: Customizers Panel */}
            <div className="flex-1 space-y-6 w-full">
              {/* 1. Customizer Generator Card */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-lg font-bold text-slate-800">Interactive Roadmap Generator</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Input specific launch targets or strategic focus areas (e.g. &quot;Focus on student campus sales&quot; or &quot;Partner with local micro-retailers&quot;) to regenerate a fully tailored roadmap plan.
                </p>
                 <div className="flex gap-3">
                  <input
                    type="text"
                    value={roadmapFocus}
                    onChange={(e) => setRoadmapFocus(e.target.value)}
                    placeholder="e.g. Campus marketing campaign, SEO expansion, wholesale distribution"
                    disabled={disableEdits}
                    className="flex-1 bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-500 focus:outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleGenerateRoadmap}
                    disabled={isGeneratingRoadmap || !roadmapFocus || disableEdits || isGenerationBlocked}
                    title={disableEdits ? "Viewer mode: editing disabled" : isGenerationBlocked ? "AI generations limit reached" : ""}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isGeneratingRoadmap ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Regenerate'}
                  </button>
                </div>
                {renderAiErrorAlert(roadmapError, roadmapLogId, handleGenerateRoadmap, () => setRoadmapError(''))}
              </div>

              {/* 2. 30-Day Plan Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">30-Day Objective Plan</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Customize weekly launch sprints and subtasks</p>
                  </div>
                </div>

                {plan30Day.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No 30-day goals set. Generate or add tasks.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plan30Day.map((week: any, wIdx: number) => (
                      <div key={wIdx} className="p-5 bg-slate-50/40 border border-slate-100 hover:border-slate-200 rounded-2xl flex flex-col justify-between transition-colors">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-emerald-700 uppercase">
                              Week {week.week || wIdx + 1}
                            </span>
                          </div>
                          
                          {/* Goal Input */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Weekly Goal</label>
                            <input
                              type="text"
                              value={week.goal || ''}
                              onChange={(e) => updateWeekGoal(wIdx, e.target.value)}
                              disabled={disableEdits}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>

                          {/* Subtasks List */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Tasks</label>
                              <button
                                onClick={() => addWeekTask(wIdx)}
                                disabled={disableEdits}
                                className="text-[10px] text-emerald-700 hover:text-emerald-350 flex items-center gap-1 font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-3 h-3" /> Add Task
                              </button>
                            </div>
                            <div className="space-y-2">
                              {week.tasks?.map((task: string, tIdx: number) => (
                                <div key={tIdx} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={task}
                                    onChange={(e) => updateWeekTask(wIdx, tIdx, e.target.value)}
                                    disabled={disableEdits}
                                    className="flex-1 bg-white/60 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                                  />
                                  <button
                                    onClick={() => deleteWeekTask(wIdx, tIdx)}
                                    disabled={disableEdits}
                                    className="text-slate-600 hover:text-red-400 p-1 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                                    title="Delete task"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. 90-Day Plan Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">90-Day Milestones</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Customize monthly milestones and key sub-targets</p>
                  </div>
                </div>

                {plan90Day.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No 90-day targets set.</p>
                ) : (
                  <div className="space-y-4">
                    {plan90Day.map((month: any, mIdx: number) => (
                      <div key={mIdx} className="p-5 bg-slate-50/35 border border-slate-100/60 rounded-xl space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                          <span className="text-xs font-bold text-indigo-700 shrink-0">Month {month.month || mIdx + 1} Target:</span>
                          <input
                            type="text"
                            value={month.target || ''}
                            onChange={(e) => updateMonthTarget(mIdx, e.target.value)}
                            disabled={disableEdits}
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Sub-Milestones */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Sub-Milestones</span>
                            <button
                              onClick={() => addMonthMilestone(mIdx)}
                              disabled={disableEdits}
                              className="text-[10px] text-emerald-455 hover:text-emerald-350 flex items-center gap-1 font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3 h-3" /> Add Milestone
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {month.sub_milestones?.map((sm: string, msIdx: number) => (
                              <div key={msIdx} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={sm}
                                  onChange={(e) => updateMonthMilestone(mIdx, msIdx, e.target.value)}
                                  disabled={disableEdits}
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                                />
                                <button
                                  onClick={() => deleteMonthMilestone(mIdx, msIdx)}
                                  disabled={disableEdits}
                                  className="text-slate-650 hover:text-red-400 p-1 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                                  title="Delete milestone"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Launch Checklist Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Interactive Launch Checklist</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Edit launch-day checklist tasks and track completion status</p>
                  </div>
                  <button
                    onClick={addLaunchTask}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </button>
                </div>

                {launchRoadmap.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No checklist items set.</p>
                ) : (
                  <div className="space-y-2">
                    {launchRoadmap.map((task: string, idx: number) => {
                      const isChecked = !!checkedLaunchTasks[idx];
                      return (
                        <div key={idx} className="flex gap-3 items-center p-3 bg-slate-50/30 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                          <button
                            onClick={() => toggleLaunchTaskCheck(idx)}
                            disabled={disableEdits}
                            className="text-slate-500 hover:text-emerald-400 p-0.5 transition-colors shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                            title={isChecked ? 'Mark uncompleted' : 'Mark completed'}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                          
                          <input
                            type="text"
                            value={task}
                            onChange={(e) => updateLaunchTask(idx, e.target.value)}
                            disabled={disableEdits}
                            className={`flex-1 bg-transparent border-none p-0 text-xs focus:outline-none focus:ring-0 ${
                              isChecked ? 'text-slate-550 line-through italic' : 'text-slate-700'
                            } disabled:opacity-75 disabled:cursor-not-allowed`}
                          />

                          <button
                            onClick={() => deleteLaunchTask(idx)}
                            disabled={disableEdits}
                            className="text-slate-650 hover:text-red-400 p-1 transition-colors shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                            title="Delete task"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Growth Milestones Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Growth Milestones</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Customize growth marketing channels and targets</p>
                  </div>
                  <button
                    onClick={addGrowthMilestone}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Milestone
                  </button>
                </div>

                {growthRoadmap.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No growth milestones set.</p>
                ) : (
                  <div className="space-y-3">
                    {growthRoadmap.map((milestone: string, idx: number) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="w-5 h-5 rounded-full bg-violet-950/30 border border-violet-900/30 flex items-center justify-center shrink-0 font-bold text-[10px] text-indigo-700">
                          {idx + 1}
                        </div>
                        
                        <input
                          type="text"
                          value={milestone}
                          onChange={(e) => updateGrowthMilestone(idx, e.target.value)}
                          disabled={disableEdits}
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                        />

                        <button
                          onClick={() => deleteGrowthMilestone(idx)}
                          disabled={disableEdits}
                          className="text-slate-650 hover:text-red-400 p-1 transition-colors shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                          title="Delete milestone"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sticky Summary & Commit Card */}
            <div className="w-full xl:w-96 shrink-0 xl:sticky xl:top-24 space-y-6 animate-fade-in">
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl relative overflow-hidden bg-white">
                {/* Visual guideline accent lines */}
                <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500" />

                <div className="pt-4 space-y-6">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Workspace Strategy</span>
                    <h2 className="text-2xl font-heading font-bold tracking-tight text-white mt-1">
                      Roadmap Summary
                    </h2>
                  </div>

                  {/* Checklist completion rate progress bar */}
                  {launchRoadmap.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-500 uppercase tracking-wider">Checklist Progress</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {Object.values(checkedLaunchTasks).filter(Boolean).length} / {launchRoadmap.length} Completed
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(Object.values(checkedLaunchTasks).filter(Boolean).length / launchRoadmap.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Highlights section */}
                  <div className="space-y-4 border-t border-b border-slate-200 py-4">
                    {plan30Day.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">30-Day Highlights</span>
                        <ul className="space-y-1 text-[11px] text-slate-500">
                          {plan30Day.slice(0, 2).map((week: any, idx: number) => (
                            <li key={idx} className="line-clamp-1 leading-normal flex items-start gap-1">
                              <span className="text-emerald-700">W{week.week || idx + 1}:</span>
                              {week.goal || 'No goal set'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan90Day.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">90-Day Milestones</span>
                        <ul className="space-y-1 text-[11px] text-slate-500 font-semibold">
                          {plan90Day.slice(0, 2).map((month: any, idx: number) => (
                            <li key={idx} className="line-clamp-1 leading-normal flex items-start gap-1">
                              <span className="text-violet-450">M{month.month || idx + 1}:</span>
                              {month.target || 'No target set'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {roadmapSaveStatus !== 'idle' && (
                    <div className={`p-3 rounded-xl border text-xs leading-normal ${
                      roadmapSaveStatus === 'success' ? 'bg-slate-100 border-emerald-900/30 text-emerald-700' : 'bg-red-50 border-red-900/30 text-red-405'
                    }`}>
                      {roadmapSaveMessage}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={handleSaveRoadmap}
                      disabled={isSavingRoadmap || disableEdits}
                      title={disableEdits ? "Viewer mode: editing disabled" : ""}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSavingRoadmap ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Roadmap
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Marketing Center */}
        {activeTab === 'marketing' && (
          <div id="tour-step-marketing" className="flex flex-col xl:flex-row gap-8 items-start w-full">
            {/* Left: Customizers Panel */}
            <div className="flex-1 space-y-6 w-full">
              {/* 1. Customizer Generator Card */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-emerald-455" />
                  <h3 className="text-lg font-bold text-slate-800">Interactive Marketing Engine</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Input campaign objectives or target promotions (e.g. &quot;Winter hoodie flash sale&quot; or &quot;Sustainable organic fashion launch&quot;) to regenerate customized copywriting campaigns.
                </p>
                 <div className="flex gap-3">
                  <input
                    type="text"
                    value={marketingFocus}
                    onChange={(e) => setMarketingFocus(e.target.value)}
                    placeholder="e.g. Winter product launch, student discount campaign, sustainable materials highlight"
                    disabled={disableEdits}
                    className="flex-1 bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-500 focus:outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleGenerateMarketing}
                    disabled={isGeneratingMarketing || !marketingFocus || disableEdits || isGenerationBlocked}
                    title={disableEdits ? "Viewer mode: editing disabled" : isGenerationBlocked ? "AI generations limit reached" : ""}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isGeneratingMarketing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Regenerate'}
                  </button>
                </div>
                {renderAiErrorAlert(marketingError, marketingLogId, handleGenerateMarketing, () => setMarketingError(''))}
              </div>

              {/* 2. Instagram Campaigns Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Instagram Campaigns</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Edit image ideas, captions, and hashtags</p>
                  </div>
                  <button
                    onClick={addInstagramPost}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Post
                  </button>
                </div>

                {instagramCampaigns.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No Instagram campaigns set.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {instagramCampaigns.map((post: any, idx: number) => (
                      <div key={idx} className="p-5 bg-slate-50/40 border border-slate-100 hover:border-slate-200 rounded-2xl flex flex-col justify-between transition-colors space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Instagram Post {idx + 1}</span>
                            <button
                              onClick={() => deleteInstagramPost(idx)}
                              disabled={disableEdits}
                              className="text-slate-600 hover:text-red-400 p-1 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                              title="Delete post"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Image / Visual Idea</label>
                            <textarea
                              value={post.image_idea || ''}
                              onChange={(e) => updateInstagramPost(idx, { image_idea: e.target.value })}
                              rows={2}
                              disabled={disableEdits}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Caption</label>
                            <textarea
                              value={post.caption || ''}
                              onChange={(e) => updateInstagramPost(idx, { caption: e.target.value })}
                              rows={3}
                              disabled={disableEdits}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Hashtags (Comma separated)</label>
                            <input
                              type="text"
                              value={post.hashtags?.join(', ') || ''}
                              onChange={(e) => updateInstagramPost(idx, { hashtags: e.target.value.split(',').map((h: string) => h.trim()).filter(Boolean) })}
                              disabled={disableEdits}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. LinkedIn Campaigns Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">LinkedIn Campaigns</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Edit hooks and bodies for professional outreach</p>
                  </div>
                  <button
                    onClick={addLinkedinPost}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Post
                  </button>
                </div>

                {linkedinCampaigns.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No LinkedIn posts set.</p>
                ) : (
                  <div className="space-y-4">
                    {linkedinCampaigns.map((post: any, idx: number) => (
                      <div key={idx} className="p-5 bg-slate-50/35 border border-slate-100 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">LinkedIn Post {idx + 1}</span>
                          <button
                            onClick={() => deleteLinkedinPost(idx)}
                            disabled={disableEdits}
                            className="text-slate-600 hover:text-red-400 p-1 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                            title="Delete post"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Hook Line</label>
                          <input
                            type="text"
                            value={post.hook || ''}
                            onChange={(e) => updateLinkedinPost(idx, { hook: e.target.value })}
                            disabled={disableEdits}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Body Copy</label>
                          <textarea
                            value={post.body || ''}
                            onChange={(e) => updateLinkedinPost(idx, { body: e.target.value })}
                            rows={4}
                            disabled={disableEdits}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-555 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>

                {/* 4. Email Onboarding Sequences Editor */}
                <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Email Onboarding Sequence</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Edit subject lines, copy, and trigger timeline schedules</p>
                  </div>
                  <button
                    onClick={addEmailSequence}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Email
                  </button>
                </div>

                {emailSequences.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No onboarding email sequences set.</p>
                ) : (
                  <div className="space-y-4">
                    {emailSequences.map((email: any, idx: number) => (
                      <div key={idx} className="p-5 bg-slate-50/30 border border-slate-100 rounded-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase">Email {idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500">Trigger: Day</span>
                              <input
                                type="number"
                                value={email.trigger_day || 0}
                                onChange={(e) => updateEmailSequence(idx, { trigger_day: parseInt(e.target.value) || 0 })}
                                disabled={disableEdits}
                                className="w-10 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-semibold text-[10px] text-slate-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCopy(`${email.subject}\n\n${email.body}`, `email-${idx}`)}
                              className="text-slate-500 hover:text-slate-700 p-1"
                              title="Copy email text"
                            >
                              {copiedText === `email-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => deleteEmailSequence(idx)}
                              disabled={disableEdits}
                              className="text-slate-650 hover:text-red-400 p-1 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                              title="Delete email"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Subject Line</label>
                          <input
                            type="text"
                            value={email.subject || ''}
                            onChange={(e) => updateEmailSequence(idx, { subject: e.target.value })}
                            disabled={disableEdits}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Email Body Content</label>
                          <textarea
                            value={email.body || ''}
                            onChange={(e) => updateEmailSequence(idx, { body: e.target.value })}
                            rows={4}
                            disabled={disableEdits}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Ad Copy Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Advertising Copy Channels</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Customize short-form Google, Meta, and LinkedIn ads</p>
                  </div>
                </div>

                {['google', 'meta', 'linkedin'].map((platform) => {
                  const items = adCopy[platform] || [];
                  return (
                    <div key={platform} className="p-5 bg-slate-50/35 border border-slate-100 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">{platform} Ads</span>
                        <button
                          onClick={() => addAdCopy(platform)}
                          disabled={disableEdits}
                          className="text-[10px] text-emerald-700 hover:text-emerald-350 flex items-center gap-1 font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" /> Add Copy
                        </button>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-xs text-slate-700 italic">No ad copy items configured for this channel.</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((text: string, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={text}
                                onChange={(e) => updateAdCopyText(platform, idx, e.target.value)}
                                disabled={disableEdits}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                              />
                              <button
                                onClick={() => deleteAdCopy(platform, idx)}
                                disabled={disableEdits}
                                className="text-slate-600 hover:text-red-400 p-1 transition-colors shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                                title="Delete ad copy"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 6. Content Publishing Calendar Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-805">Content Publishing Calendar</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Customize Day, Platform, and Topic details</p>
                  </div>
                  <button
                    onClick={addContentCalendarEvent}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Day/Platform
                  </button>
                </div>

                {contentCalendar.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No calendar slots set.</p>
                ) : (
                  <div className="overflow-x-auto animate-fade-in">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-700 font-bold uppercase tracking-wider">
                          <th className="py-2.5 w-16">Day</th>
                          <th className="py-2.5 w-32">Platform</th>
                          <th className="py-2.5">Topic Details</th>
                          <th className="py-2.5 w-10 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {contentCalendar.map((item: any, idx: number) => (
                          <tr key={idx} className="text-slate-700 text-xs">
                            <td className="py-2">
                              <input
                                type="number"
                                value={item.day || 0}
                                onChange={(e) => updateContentCalendarEvent(idx, { day: parseInt(e.target.value) || 0 })}
                                disabled={disableEdits}
                                className="w-12 bg-white border border-slate-200 rounded px-1.5 py-1 text-center font-bold text-xs text-emerald-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <select
                                value={item.platform || ''}
                                onChange={(e) => updateContentCalendarEvent(idx, { platform: e.target.value })}
                                disabled={disableEdits}
                                className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] uppercase font-semibold text-indigo-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                              >
                                <option value="instagram">Instagram</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="blog">Blog / SEO</option>
                                <option value="email">Email</option>
                                <option value="ads">Ad Launch</option>
                              </select>
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={item.topic || ''}
                                onChange={(e) => updateContentCalendarEvent(idx, { topic: e.target.value })}
                                disabled={disableEdits}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => deleteContentCalendarEvent(idx)}
                                disabled={disableEdits}
                                className="text-slate-700 hover:text-red-400 p-1 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                                title="Delete event"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sticky Summary & Commit Card */}
            <div className="w-full xl:w-96 shrink-0 xl:sticky xl:top-24 space-y-6">
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl relative overflow-hidden bg-white">
                <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500" />

                <div className="pt-4 space-y-6">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Workspace Marketing</span>
                    <h2 className="text-2xl font-heading font-bold tracking-tight text-white mt-1">
                      Campaign Summary
                    </h2>
                  </div>

                  <div className="space-y-4 border-t border-b border-slate-200 py-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">Instagram Posts</span>
                      <span className="font-semibold text-slate-800">{instagramCampaigns.length} posts</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">LinkedIn Hooks</span>
                      <span className="font-semibold text-slate-800">{linkedinCampaigns.length} updates</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">Email Templates</span>
                      <span className="font-semibold text-slate-800">{emailSequences.length} sequences</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">Total Google & Social Ads</span>
                      <span className="font-semibold text-slate-800">
                        {((adCopy.google?.length || 0) + (adCopy.meta?.length || 0) + (adCopy.linkedin?.length || 0))} copies
                      </span>
                    </div>
                  </div>

                  {marketingSaveStatus !== 'idle' && (
                    <div className={`p-3 rounded-xl border text-xs leading-normal ${
                      marketingSaveStatus === 'success' ? 'bg-slate-100 border-emerald-900/30 text-emerald-700' : 'bg-red-50 border-red-900/30 text-red-405'
                    }`}>
                      {marketingSaveMessage}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={handleSaveMarketing}
                      disabled={isSavingMarketing || disableEdits}
                      title={disableEdits ? "Viewer mode: editing disabled" : ""}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSavingMarketing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Marketing Plan
                        </>
                      )}
                    </button>
                  </div>
                  <InlineCommentsWidget
                    workspaceId={workspace.id}
                    resourceType="marketing"
                    comments={commentsList}
                    onAddComment={handleAddInlineComment}
                    onDeleteComment={handleDeleteInlineComment}
                    disableEdits={disableEdits}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Pitch Deck Generator */}
        {activeTab === 'pitchdeck' && (
          <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
            {/* Left Column: Editor Forms */}
            <div className="flex-1 space-y-6 w-full animate-fade-in">
              {/* 1. Generator Card */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-lg font-bold text-slate-800">Interactive Pitch Deck Generator</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provide custom focus areas (e.g. &quot;Highlight our local organic supply chain and direct campus ambassador model&quot;) to auto-compile structured slide outlines.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={pitchDeckFocus}
                    onChange={(e) => setPitchDeckFocus(e.target.value)}
                    placeholder="e.g. Local sourcing, subscription tiers, campus launch plan..."
                    disabled={disableEdits}
                    className="flex-1 bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleGeneratePitchDeck}
                    disabled={isGeneratingPitchDeck || !pitchDeckFocus || disableEdits || isGenerationBlocked}
                    title={disableEdits ? "Viewer mode: editing disabled" : isGenerationBlocked ? "AI generation limit reached (10/10 runs)" : ""}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-955 font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPitchDeck ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Generate'}
                  </button>
                </div>
                {renderAiErrorAlert(pitchDeckError, pitchDeckLogId, handleGeneratePitchDeck, () => setPitchDeckError(''))}
              </div>

              {/* 2. Core Slides Editors */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3">Core Slides Data</h3>

                {/* Problem Slide */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Slide 2: Problem Statement</label>
                  <textarea
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    rows={3}
                    placeholder="Explain the primary market pain point you are solving..."
                    disabled={disableEdits}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Solution Slide */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Slide 3: Solution Statement</label>
                  <textarea
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    rows={3}
                    placeholder="Describe your product value proposition and how it relieves the pain point..."
                    disabled={disableEdits}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Market Size Slide */}
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Slide 4: Market Sizing (TAM / SAM / SOM)</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-550 font-bold uppercase">TAM (Total Market)</span>
                      <input
                        type="text"
                        value={marketSize.tam}
                        onChange={(e) => setMarketSize({ ...marketSize, tam: e.target.value })}
                        placeholder="e.g. ₹5,000 Cr Gen-Z fashion"
                        disabled={disableEdits}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-555 font-bold uppercase">SAM (Serviceable Market)</span>
                      <input
                        type="text"
                        value={marketSize.sam}
                        onChange={(e) => setMarketSize({ ...marketSize, sam: e.target.value })}
                        placeholder="e.g. ₹800 Cr college students"
                        disabled={disableEdits}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-555 font-bold uppercase">SOM (Target Share)</span>
                      <input
                        type="text"
                        value={marketSize.som}
                        onChange={(e) => setMarketSize({ ...marketSize, som: e.target.value })}
                        placeholder="e.g. ₹12 Cr Year 1 campuses"
                        disabled={disableEdits}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Model Slide */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Slide 5: Business Model</label>
                  <textarea
                    value={businessModel}
                    onChange={(e) => setBusinessModel(e.target.value)}
                    rows={3}
                    placeholder="Describe how your startup makes money (monetization channels)..."
                    disabled={disableEdits}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                {/* GTM Slide */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Slide 6: Go-To-Market (GTM) Strategy</label>
                  <textarea
                    value={gtmStrategy}
                    onChange={(e) => setGtmStrategy(e.target.value)}
                    rows={3}
                    placeholder="Explain your customer acquisition and distribution loops..."
                    disabled={disableEdits}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* 3. Custom Slides Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Custom Presentation Slides</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage additional pitch deck slides (e.g. Team, Competitors, Financials)</p>
                  </div>
                  <button
                    onClick={addCustomSlide}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Slide
                  </button>
                </div>

                {customSlides.length === 0 ? (
                  <p className="text-xs text-slate-650 italic">No custom slides created yet. Add team slides or market comparison cards!</p>
                ) : (
                  <div className="space-y-4">
                    {customSlides.map((slide: any, idx: number) => (
                      <div key={idx} className="p-5 bg-slate-50/35 border border-slate-100 rounded-xl space-y-4 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Slide {idx + 7}: Custom</span>
                          <button
                            onClick={() => deleteCustomSlide(idx)}
                            disabled={disableEdits}
                            className="text-slate-650 hover:text-red-400 p-1 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                            title="Delete slide"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Slide Title</label>
                          <input
                            type="text"
                            value={slide.title || ''}
                            onChange={(e) => updateCustomSlide(idx, { title: e.target.value })}
                            placeholder="e.g. Competitor Analysis"
                            disabled={disableEdits}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Slide Content</label>
                          <textarea
                            value={slide.content || ''}
                            onChange={(e) => updateCustomSlide(idx, { content: e.target.value })}
                            rows={4}
                            placeholder="Detail your slide points or metrics narrative..."
                            disabled={disableEdits}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Visual Layout Suggestion</label>
                          <input
                            type="text"
                            value={slide.visual_layout_suggestion || ''}
                            onChange={(e) => updateCustomSlide(idx, { visual_layout_suggestion: e.target.value })}
                            placeholder="e.g. Split vertical cols, center-aligned icons grid..."
                            disabled={disableEdits}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Slide Preview & Actions */}
            <div className="w-full xl:w-96 shrink-0 xl:sticky xl:top-24 space-y-6">
              {/* Slide Preview Card */}
              <div className="glass-panel border border-slate-200 p-4 rounded-3xl bg-white space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Live Slide Preview</span>

                {/* Landscape Widescreen Slide Container */}
                <div className="relative aspect-[16/9] w-full rounded-2xl bg-[#0b0f19] border border-slate-200 flex flex-col justify-between p-6 overflow-hidden shadow-2xl">
                  {/* Decorative Header Accent */}
                  <div className="absolute top-0 left-0 w-full h-[3px] flex">
                    <div className="w-1/2 h-full bg-emerald-500" />
                    <div className="w-1/2 h-full bg-indigo-500" />
                  </div>

                  {/* Slide Content Layout */}
                  <div className="flex-1 flex flex-col justify-start min-h-0">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-emerald-700 tracking-tight leading-none uppercase truncate max-w-full">
                        {allSlides[activeSlideIndex]?.title || 'Pitch Deck Slide'}
                      </h4>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col justify-center min-h-0 overflow-y-auto pr-1">
                      {allSlides[activeSlideIndex]?.type === 'title' ? (
                        <div className="text-center py-2">
                          <h1 className="text-lg font-extrabold text-white uppercase tracking-tight line-clamp-2">
                            {allSlides[activeSlideIndex]?.title}
                          </h1>
                          <p className="text-[10px] text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                            {allSlides[activeSlideIndex]?.content}
                          </p>
                        </div>
                      ) : allSlides[activeSlideIndex]?.type === 'market' ? (
                        <div className="grid grid-cols-3 gap-2 py-1 text-left">
                          <div className="bg-[#141b2d] border border-slate-200/80 rounded-lg p-2 flex flex-col justify-between">
                            <span className="text-[7px] text-slate-600 font-bold uppercase leading-none">TAM</span>
                            <span className="text-[10px] font-bold text-white mt-1 truncate">{marketSize.tam || 'N/A'}</span>
                          </div>
                          <div className="bg-[#141b2d] border border-slate-200/80 rounded-lg p-2 flex flex-col justify-between">
                            <span className="text-[7px] text-slate-600 font-bold uppercase leading-none">SAM</span>
                            <span className="text-[10px] font-bold text-white mt-1 truncate">{marketSize.sam || 'N/A'}</span>
                          </div>
                          <div className="bg-[#141b2d] border border-slate-200/80 rounded-lg p-2 flex flex-col justify-between">
                            <span className="text-[7px] text-slate-600 font-bold uppercase leading-none">SOM</span>
                            <span className="text-[10px] font-bold text-white mt-1 truncate">{marketSize.som || 'N/A'}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {allSlides[activeSlideIndex]?.content || 'Slide content goes here...'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footnotes & Layout Suggestion */}
                  <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center text-[7px] text-slate-500 uppercase tracking-wider font-semibold">
                    <span className="truncate max-w-[180px]">
                      {allSlides[activeSlideIndex]?.visual_layout_suggestion 
                        ? `Visual: ${allSlides[activeSlideIndex].visual_layout_suggestion}`
                        : `StartupOS Slide Deck`
                      }
                    </span>
                    <span>
                      Page {activeSlideIndex + 1} of {allSlides.length}
                    </span>
                  </div>
                </div>

                {/* Slide Navigation controls */}
                <div className="flex justify-between items-center px-2 py-1 bg-slate-50/50 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                    disabled={activeSlideIndex === 0}
                    className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-slate-250 disabled:opacity-75 rounded-lg transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-[10px] font-bold text-slate-500">
                    Slide {activeSlideIndex + 1} / {allSlides.length}
                  </span>

                  <button
                    onClick={() => setActiveSlideIndex(Math.min(allSlides.length - 1, activeSlideIndex + 1))}
                    disabled={activeSlideIndex === allSlides.length - 1}
                    className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-slate-250 disabled:opacity-75 rounded-lg transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actions Commit Card */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl relative overflow-hidden bg-white">
                <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500" />
                <div className="pt-4 space-y-6">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Deck Publishing</span>
                    <h3 className="text-xl font-heading font-bold tracking-tight text-white mt-1">Export & Commit</h3>
                  </div>

                  <div className="space-y-4 border-t border-b border-slate-200 py-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">Total Slides</span>
                      <span className="font-semibold text-slate-800">{allSlides.length} slides</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">Custom Slides</span>
                      <span className="font-semibold text-slate-800">{customSlides.length} slides</span>
                    </div>
                  </div>

                  {pitchDeckSaveStatus !== 'idle' && (
                    <div className={`p-3 rounded-xl border text-xs leading-normal ${
                      pitchDeckSaveStatus === 'success' ? 'bg-slate-100 border-emerald-900/30 text-emerald-700' : 'bg-red-50 border-red-900/30 text-red-405'
                    }`}>
                      {pitchDeckSaveMessage}
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={handleSavePitchDeck}
                      disabled={isSavingPitchDeck || disableEdits}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSavingPitchDeck ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Pitch Deck
                        </>
                      )}
                    </button>

                    <button
                      onClick={exportToPDF}
                      disabled={disableEdits}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-850 text-slate-800 border border-slate-200 font-bold rounded-2xl text-xs transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      Export to PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Landing Page Generator */}
        {activeTab === 'landingpage' && (
          <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
            {/* Left Column: Editor Forms */}
            <div className="flex-1 space-y-6 w-full animate-fade-in">
              {/* 1. Generator Focus Panel */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-lg font-bold text-slate-800">Interactive Landing Page Engine</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Supply layout themes or marketing pitches (e.g. &quot;High student discounts, organic leaf design, WhatsApp reps loops&quot;) to generate copy and Tailwind code.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={landingPageFocus}
                    onChange={(e) => setLandingPageFocus(e.target.value)}
                    placeholder="e.g. College ambassador discounts, sustainable clothing flash sales..."
                    disabled={disableEdits}
                    className="flex-1 bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleGenerateLandingPage}
                    disabled={isGeneratingLandingPage || !landingPageFocus || disableEdits || isGenerationBlocked}
                    title={disableEdits ? "Viewer mode: editing disabled" : isGenerationBlocked ? "AI generation limit reached (10/10 runs)" : ""}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-955 font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isGeneratingLandingPage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Generate'}
                  </button>
                </div>
                {renderAiErrorAlert(landingPageError, landingPageLogId, handleGenerateLandingPage, () => setLandingPageError(''))}
              </div>

              {/* 2. Hero Section Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-3">Hero Section</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Catchy Heading / Title</label>
                    <input
                      type="text"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      disabled={disableEdits}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Subheading / Subtitle Description</label>
                    <textarea
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      rows={3}
                      disabled={disableEdits}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">CTA Button Label</label>
                      <input
                        type="text"
                        value={heroCtaText}
                        onChange={(e) => setHeroCtaText(e.target.value)}
                        disabled={disableEdits}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">CTA Target Link</label>
                      <input
                        type="text"
                        value={heroCtaUrl}
                        onChange={(e) => setHeroCtaUrl(e.target.value)}
                        disabled={disableEdits}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Features Section Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Core Features & Benefits</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Highlight key values and select visual badge icons</p>
                  </div>
                  <button
                    onClick={addFeature}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-700 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Benefit
                  </button>
                </div>

                {featuresList.length === 0 ? (
                  <p className="text-xs text-slate-650 italic">No features configured.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featuresList.map((feat, idx) => (
                      <div key={idx} className="p-4 bg-slate-50/35 border border-slate-100 rounded-xl space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Benefit {idx + 1}</span>
                          <button
                            onClick={() => deleteFeature(idx)}
                            disabled={disableEdits}
                            className="text-slate-650 hover:text-red-400 p-1 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2 space-y-1">
                            <span className="text-[9px] text-slate-550 font-bold uppercase">Heading</span>
                            <input
                              type="text"
                              value={feat.title || ''}
                              onChange={(e) => updateFeature(idx, { title: e.target.value })}
                              disabled={disableEdits}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-555 font-bold uppercase">Badge Icon</span>
                            <select
                              value={feat.icon || 'Zap'}
                              onChange={(e) => updateFeature(idx, { icon: e.target.value })}
                              disabled={disableEdits}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-700 font-semibold focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                              <option value="Leaf">Leaf (Green)</option>
                              <option value="Zap">Lightning (Gold)</option>
                              <option value="Users">Users (Purple)</option>
                              <option value="Globe">Globe (Blue)</option>
                              <option value="Shield">Shield (Secure)</option>
                              <option value="Star">Star (Rating)</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-550 font-bold uppercase">Description</span>
                          <textarea
                            value={feat.description || ''}
                            onChange={(e) => updateFeature(idx, { description: e.target.value })}
                            rows={2}
                            disabled={disableEdits}
                            className="w-full bg-[#0a0f1d] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Pricing Tiers Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Pricing Packages</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage monetization packages and pricing tags</p>
                  </div>
                  <button
                    onClick={addPricingPlan}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-700 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Package
                  </button>
                </div>

                {pricingPlans.length === 0 ? (
                  <p className="text-xs text-slate-650 italic">No plans configured.</p>
                ) : (
                  <div className="space-y-4">
                    {pricingPlans.map((plan, idx) => (
                      <div key={idx} className="p-5 bg-slate-50/40 border border-slate-100 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-indigo-700 font-bold uppercase">Tier {idx + 1}</span>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!plan.is_popular}
                                onChange={(e) => updatePricingPlan(idx, { is_popular: e.target.checked })}
                                disabled={disableEdits}
                                className="w-3.5 h-3.5 accent-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                              />
                              <span className="text-[9px] text-slate-550 font-bold uppercase">Highlight Popular</span>
                            </label>
                          </div>
                          <button
                            onClick={() => deletePricingPlan(idx)}
                            disabled={disableEdits}
                            className="text-slate-650 hover:text-red-400 p-1 disabled:opacity-75 disabled:cursor-not-allowed"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Name</span>
                            <input
                              type="text"
                              value={plan.name || ''}
                              onChange={(e) => updatePricingPlan(idx, { name: e.target.value })}
                              disabled={disableEdits}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-550 font-bold uppercase">Price Tag</span>
                            <input
                              type="text"
                              value={plan.price || ''}
                              onChange={(e) => updatePricingPlan(idx, { price: e.target.value })}
                              disabled={disableEdits}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-555 font-bold uppercase">Interval Period</span>
                            <input
                              type="text"
                              value={plan.period || ''}
                              onChange={(e) => updatePricingPlan(idx, { period: e.target.value })}
                              placeholder="e.g. one-time or month"
                              disabled={disableEdits}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-555 font-bold uppercase">Button Label</span>
                            <input
                              type="text"
                              value={plan.button_text || ''}
                              onChange={(e) => updatePricingPlan(idx, { button_text: e.target.value })}
                              disabled={disableEdits}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-555 font-bold uppercase">Features List (Comma-separated)</span>
                          <input
                            type="text"
                            value={plan.features?.join(', ') || ''}
                            onChange={(e) => updatePricingPlan(idx, { features: e.target.value.split(',').map((f: string) => f.trim()).filter(Boolean) })}
                            disabled={disableEdits}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Testimonials Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Customer Testimonials</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage customer reviews and feedback quotes</p>
                  </div>
                  <button
                    onClick={addTestimonial}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-700 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Review
                  </button>
                </div>

                {testimonialsList.length === 0 ? (
                  <p className="text-xs text-slate-650 italic">No reviews set.</p>
                ) : (
                  <div className="space-y-4">
                    {testimonialsList.map((test, idx) => (
                      <div key={idx} className="p-4 bg-slate-50/35 border border-slate-100 rounded-xl space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase">Review {idx + 1}</span>
                          <button
                            onClick={() => deleteTestimonial(idx)}
                            disabled={disableEdits}
                            className="text-slate-650 hover:text-red-400 p-1 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-550 font-bold uppercase">Author Name</span>
                            <input
                              type="text"
                              value={test.name || ''}
                              onChange={(e) => updateTestimonial(idx, { name: e.target.value })}
                              disabled={disableEdits}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-550 font-bold uppercase">Role Title</span>
                            <input
                              type="text"
                              value={test.role || ''}
                              onChange={(e) => updateTestimonial(idx, { role: e.target.value })}
                              disabled={disableEdits}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-555 font-bold uppercase">Company</span>
                            <input
                              type="text"
                              value={test.company || ''}
                              onChange={(e) => updateTestimonial(idx, { company: e.target.value })}
                              disabled={disableEdits}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-555 font-bold uppercase">Review Content Quote</span>
                          <textarea
                            value={test.content || ''}
                            onChange={(e) => updateTestimonial(idx, { content: e.target.value })}
                            rows={3}
                            disabled={disableEdits}
                            className="w-full bg-[#0a0f1c] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-705 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. FAQ Section Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">FAQ Accordion Questions</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Draft common queries and onboarding explanations</p>
                  </div>
                  <button
                    onClick={addFaq}
                    disabled={disableEdits}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-950/50 border border-emerald-900/50 text-emerald-700 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add FAQ
                  </button>
                </div>

                {faqsList.length === 0 ? (
                  <p className="text-xs text-slate-650 italic">No FAQs configured.</p>
                ) : (
                  <div className="space-y-4">
                    {faqsList.map((faq, idx) => (
                      <div key={idx} className="p-4 bg-slate-50/35 border border-slate-100 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-violet-405 font-bold uppercase">FAQ Item {idx + 1}</span>
                          <button
                            onClick={() => deleteFaq(idx)}
                            disabled={disableEdits}
                            className="text-slate-650 hover:text-red-400 p-1 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">Question</span>
                          <input
                            type="text"
                            value={faq.question || ''}
                            onChange={(e) => updateFaq(idx, { question: e.target.value })}
                            disabled={disableEdits}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">Answer Details</span>
                          <textarea
                            value={faq.answer || ''}
                            onChange={(e) => updateFaq(idx, { answer: e.target.value })}
                            rows={3}
                            disabled={disableEdits}
                            className="w-full bg-[#0a0f1d] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Advanced Next.js React Code Editor */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Next.js React Source Code</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Self-contained component styled with TailwindCSS utilities</p>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-500">
                    <input
                      type="checkbox"
                      checked={editCodeManually}
                      onChange={(e) => setEditCodeManually(e.target.checked)}
                      disabled={disableEdits}
                      className="w-3.5 h-3.5 accent-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                    <span className="text-[9px] font-bold uppercase">Edit Code Manually</span>
                  </label>
                </div>
                <div className="relative font-mono rounded-2xl overflow-hidden border border-slate-200">
                  <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <textarea
                    value={landingPageCode}
                    onChange={(e) => { if (editCodeManually && !disableEdits) setLandingPageCode(e.target.value); }}
                    readOnly={!editCodeManually || disableEdits}
                    disabled={disableEdits}
                    rows={15}
                    placeholder="// Source code TSX component here"
                    className="w-full bg-slate-50 border-none text-[11px] text-emerald-500 font-semibold px-4 pt-10 pb-4 focus:outline-none resize-y disabled:opacity-75"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Live Mobile Preview & Publishing Actions */}
            <div className="w-full xl:w-96 shrink-0 xl:sticky xl:top-24 space-y-6">
              {/* Responsive Device Frame Screen */}
              <div className="glass-panel border border-slate-200 p-4 rounded-3xl bg-white space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Live Mobile Preview</span>

                {/* iPhone / Android Wrapper Shell */}
                <div className="border-[6px] border-slate-200 rounded-[2.5rem] bg-white overflow-hidden relative shadow-2xl w-full max-w-[340px] mx-auto select-none">
                  {/* Camera Notch */}
                  <div className="w-24 h-4 bg-slate-800 rounded-full absolute top-2 left-1/2 -translate-x-1/2 z-20" />

                  {/* Device Screen Frame Viewport */}
                  <div className="aspect-[9/16] w-full flex flex-col justify-start overflow-y-auto px-4 py-8 text-left scrollbar-thin relative scrollbar-track-transparent">
                    {/* Header navbar inside mobile */}
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-3 mb-6">
                      <span className="text-xs font-heading font-extrabold text-white tracking-tight">
                        {selectedName || workspace.name || 'Startup'}
                      </span>
                      <a
                        href={heroCtaUrl}
                        className="px-2.5 py-1 bg-emerald-500 text-white text-[8px] font-bold rounded-lg uppercase"
                      >
                        {heroCtaText || 'Buy'}
                      </a>
                    </div>

                    {/* Hero copy inside preview */}
                    <div className="text-center py-6 border-b border-slate-200/40 relative">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                      <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 text-[7px] font-bold uppercase rounded-full">
                        Now Active
                      </span>
                      <h1 className="text-base font-extrabold text-white tracking-tight mt-3 leading-snug">
                        {heroTitle || 'Your Dream Startup Idea Launching'}
                      </h1>
                      <p className="text-[9px] text-slate-500 mt-2 leading-relaxed">
                        {heroSubtitle || 'Eco friendly organic clothing, competitive pricing models, and direct campus ambassadorship loops.'}
                      </p>
                      <a
                        href={heroCtaUrl}
                        className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-emerald-500 text-white text-[9px] font-bold rounded-lg uppercase"
                      >
                        {heroCtaText || 'Get Started'} <ArrowRight className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    {/* Features loop inside preview */}
                    <div className="py-6 border-b border-slate-200/40 space-y-4">
                      <h4 className="text-[10px] font-bold text-white tracking-wider uppercase text-center">Core Benefits</h4>
                      {featuresList.map((feat, idx) => (
                        <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex gap-3 items-start">
                          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                            {renderFeatureIcon(feat.icon)}
                          </div>
                          <div>
                            <h5 className="text-[10px] font-bold text-slate-800 leading-normal">{feat.title || 'Benefit Title'}</h5>
                            <p className="text-[8px] text-slate-500 leading-normal mt-0.5">{feat.description || 'Description details...'}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pricing packages inside preview */}
                    <div className="py-6 border-b border-slate-200/40 space-y-4">
                      <h4 className="text-[10px] font-bold text-white tracking-wider uppercase text-center">Pricing Options</h4>
                      <div className="space-y-3">
                        {pricingPlans.map((plan, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border flex flex-col justify-between ${
                              plan.is_popular ? 'bg-slate-50 border-emerald-500/50' : 'bg-slate-50/40 border-slate-100'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-bold text-emerald-400 uppercase">{plan.name}</span>
                              {plan.is_popular && (
                                <span className="px-1.5 py-0.5 bg-emerald-400 text-white text-[6px] font-extrabold uppercase rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-sm font-bold text-white">{plan.price}</span>
                              <span className="text-[8px] text-slate-500">/ {plan.period}</span>
                            </div>
                            <ul className="mt-2 space-y-1">
                              {plan.features?.map((f: string, fidx: number) => (
                                <li key={fidx} className="text-[7px] text-slate-500 flex items-center gap-1">
                                  <Check className="w-2 h-2 text-emerald-700 shrink-0" />
                                  <span className="truncate">{f}</span>
                                </li>
                              ))}
                            </ul>
                            <button className="w-full mt-3 py-1.5 bg-emerald-500 text-white text-[8px] font-bold rounded-lg uppercase">
                              {plan.button_text}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Testimonials loop inside preview */}
                    {testimonialsList.length > 0 && (
                      <div className="py-6 border-b border-slate-200/40 space-y-3 text-center">
                        <div className="flex justify-center gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-current" />)}
                        </div>
                        <p className="text-[9px] text-slate-700 italic leading-relaxed px-2">
                          &quot;{testimonialsList[previewTestimonialIndex]?.content || 'Testimonial review copy...'}&quot;
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <button
                            onClick={() => setPreviewTestimonialIndex(Math.max(0, previewTestimonialIndex - 1))}
                            disabled={previewTestimonialIndex === 0}
                            className="p-1 hover:bg-slate-50 disabled:opacity-75 rounded text-slate-600"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <div>
                            <h5 className="text-[8px] font-bold text-slate-800">{testimonialsList[previewTestimonialIndex]?.name}</h5>
                            <span className="text-[7px] text-slate-500">
                              {testimonialsList[previewTestimonialIndex]?.role} at {testimonialsList[previewTestimonialIndex]?.company}
                            </span>
                          </div>
                          <button
                            onClick={() => setPreviewTestimonialIndex(Math.min(testimonialsList.length - 1, previewTestimonialIndex + 1))}
                            disabled={previewTestimonialIndex === testimonialsList.length - 1}
                            className="p-1 hover:bg-slate-50 disabled:opacity-75 rounded text-slate-600"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FAQ accordions inside preview */}
                    <div className="py-6 space-y-3">
                      <h4 className="text-[10px] font-bold text-white tracking-wider uppercase text-center">FAQ</h4>
                      <div className="space-y-2">
                        {faqsList.map((faq, idx) => {
                          const isOpen = previewFaqIndex === idx;
                          return (
                            <div key={idx} className="border border-slate-200 bg-white/60 rounded-xl overflow-hidden">
                              <button
                                onClick={() => setPreviewFaqIndex(isOpen ? null : idx)}
                                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50/35"
                              >
                                <span className="text-[8px] font-bold text-slate-250 leading-snug">{faq.question}</span>
                                <ChevronDown className={`w-2.5 h-2.5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {isOpen && (
                                <p className="px-3 pb-2 text-[7px] text-slate-500 border-t border-slate-200/30 pt-1.5 leading-relaxed">
                                  {faq.answer}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save & Download Actions Control Card */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl relative overflow-hidden bg-white">
                <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500" />
                <div className="pt-4 space-y-6">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Website Publishing</span>
                    <h3 className="text-xl font-heading font-bold tracking-tight text-white mt-1">Deploy & Export</h3>
                  </div>

                  <div className="space-y-4 border-t border-b border-slate-200 py-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">Tiers Pricing</span>
                      <span className="font-semibold text-slate-800">{pricingPlans.length} plans</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">Accordions FAQ</span>
                      <span className="font-semibold text-slate-800">{faqsList.length} items</span>
                    </div>
                  </div>

                  {landingPageSaveStatus !== 'idle' && (
                    <div className={`p-3 rounded-xl border text-xs leading-normal ${
                      landingPageSaveStatus === 'success' ? 'bg-slate-100 border-emerald-900/30 text-emerald-700' : 'bg-red-50 border-red-900/30 text-red-405'
                    }`}>
                      {landingPageSaveMessage}
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={handleSaveLandingPage}
                      disabled={isSavingLandingPage || disableEdits}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isSavingLandingPage ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Landing Page
                        </>
                      )}
                    </button>

                    <button
                      onClick={exportLandingPageFile}
                      disabled={disableEdits}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-850 text-slate-800 border border-slate-200 font-bold rounded-2xl text-xs transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      Download Next.js File (.tsx)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 9: Documents & Ingestion Library */}
        {activeTab === 'documents' && (
          <div id="tour-step-knowledge-content" className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-indigo-650 font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full w-fit">
                Knowledge Base Ingestion
              </span>
              <h1 className="text-2xl font-heading font-extrabold tracking-tight text-slate-900 mt-2">Venture Documents</h1>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-3xl">
                Upload and index custom market analyses, contracts, or pitch decks to ground your AI co-founder in proprietary venture data.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
              {/* Left Column: Upload Controls */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ingest Document</h3>
                    <p className="text-slate-450 text-[10px] mt-0.5">Supports PDF, TXT, JSON, MD up to 10MB.</p>
                  </div>

                  {/* Upload Card */}
                  <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors relative ${
                    planType === 'free' && uploadedDocs.length >= 1 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 hover:bg-slate-50/50'
                  }`}>
                    {!(planType === 'free' && uploadedDocs.length >= 1) && (
                      <input
                        type="file"
                        id="doc-upload"
                        accept=".pdf,.txt,.json,.md"
                        onChange={handleDocumentUpload}
                        disabled={isDocUploading || disableEdits}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                    )}
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-3 rounded-full border ${
                        planType === 'free' && uploadedDocs.length >= 1 ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}>
                        {isDocUploading ? (
                          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        ) : planType === 'free' && uploadedDocs.length >= 1 ? (
                          <Shield className="w-6 h-6 text-amber-600" />
                        ) : (
                          <UploadCloud className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {isDocUploading 
                            ? 'Processing document...' 
                            : planType === 'free' && uploadedDocs.length >= 1 
                            ? 'Document Limit Reached' 
                            : 'Click or drag file to upload'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {planType === 'free' && uploadedDocs.length >= 1 
                            ? 'Free tier is limited to 1 document upload.' 
                            : 'Supports PDF, TXT, JSON, MD (Max 10MB)'}
                        </p>
                        {planType === 'free' && uploadedDocs.length >= 1 && (
                          <button
                            onClick={() => handleActionError("Upgrade to Pro to upload more documents and unlock unlimited knowledge assistant context.", "Upgrade to Upload Documents")}
                            className="mt-3 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-indigo-650 hover:from-emerald-650 hover:to-indigo-700 text-white font-bold rounded-xl text-[10px] transition-all shadow-md active:scale-[0.98]"
                          >
                            Upgrade to Pro
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Document Quota Summary */}
                  <div className="flex items-center justify-between text-xs text-slate-650 bg-slate-50/50 p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="font-semibold text-slate-550">Document Usage</span>
                    <span className="font-bold text-slate-800">
                      {uploadedDocs.length} / {planType === 'free' ? '1' : 'Unlimited'} files
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Files List Directory */}
              <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Document Repository</h3>
                  <p className="text-slate-450 text-[10px] mt-0.5">Chronological log of files ingested into vector search storage.</p>
                </div>

                {isLoadingDocs ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading files...
                  </div>
                ) : uploadedDocs.length === 0 ? (
                  <p className="text-xs text-slate-450 italic py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    No documents uploaded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2">
                    {uploadedDocs.map((doc) => (
                      <div key={doc.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-650 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</h4>
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              {(doc.file_size / 1024).toFixed(1)} KB • Ingested {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={disableEdits}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                          title="Delete document"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 10: AI Memory & Grounded Chat Assistant */}
        {activeTab === 'memory' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-violet-600 font-bold uppercase tracking-wider bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full w-fit">
                Co-Founder AI Brain
              </span>
              <h1 className="text-2xl font-heading font-extrabold tracking-tight text-slate-900 mt-2">AI Memory Assistant</h1>
              <p className="text-slate-550 text-xs font-semibold leading-relaxed max-w-3xl">
                Consult your co-founder assistant or search through pgvector memories matching your business documents and models.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
              {/* Left Column: Semantic Search */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Semantic Query</h3>
                    <p className="text-slate-600 text-[10px] mt-0.5">Search RAG database embeddings using natural language.</p>
                  </div>

                  <form onSubmit={handleMemorySearch} className="flex gap-2.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="e.g. pricing strategy or brand slogan..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-350 focus:bg-white rounded-xl text-xs outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-[0.98] shrink-0"
                    >
                      {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                    </button>
                  </form>

                  {renderAiErrorAlert(searchError, '', () => handleMemorySearch(), () => setSearchError(''))}

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="pt-2 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cosine Similarity Matches</span>
                        <button
                          onClick={() => setSearchResults([])}
                          className="text-[9px] text-indigo-650 hover:text-indigo-850 font-bold uppercase"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {searchResults.map((match, mIdx) => (
                          <div key={mIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-slate-350 transition-all">
                            <div className="flex justify-between items-center gap-2">
                              <span className="px-2 py-0.5 bg-violet-50 border border-violet-100 text-[8px] font-bold text-violet-600 rounded-full">
                                {Math.round((match.similarity || 0.85) * 100)}% Match
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold truncate max-w-[150px]">
                                {match.metadata?.document_name || 'Workspace Core'}
                              </span>
                            </div>
                            <p className="text-slate-700 text-[11px] leading-relaxed italic font-medium">
                              &quot;{match.content?.substring(0, 180)}{match.content?.length > 180 ? '...' : ''}&quot;
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Chatbot Interface */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-sm">
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grounded Co-founder Chat</span>
                    </div>
                    {chatHistory.length > 0 && (
                      <button
                        onClick={() => {
                          setChatHistory([]);
                          setChatSources([]);
                        }}
                        className="text-[9px] text-indigo-650 hover:text-indigo-800 font-bold uppercase"
                      >
                        Clear Chat
                      </button>
                    )}
                  </div>

                  {/* Chat Message Box */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto gap-3 text-slate-450">
                        <div className="p-3 bg-white rounded-full border border-slate-200/80 shadow-sm text-slate-350">
                          <Send className="w-6 h-6 rotate-45 translate-x-0.5 -translate-y-0.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Ask the Co-founder AI</p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Query details, strategies, or assumptions. All answers are grounded in your database and uploaded documents.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatHistory.map((msg, index) => {
                          const isUser = msg.role === 'user';
                          return (
                            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                                isUser 
                                  ? 'bg-slate-900 text-white font-medium rounded-tr-none' 
                                  : 'bg-white border border-slate-200 p-4 text-slate-800 font-semibold rounded-tl-none shadow-sm'
                              }`}>
                                <p>{msg.content}</p>
                              </div>
                            </div>
                          );
                        })}
                        {isChatSending && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sources tag list */}
                  {chatSources.length > 0 && (
                    <div className="px-6 py-2 bg-slate-50 border-t border-b border-slate-100 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mr-1">Sources:</span>
                      {chatSources.map((src, sIdx) => (
                        <span key={sIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-semibold text-indigo-650">
                          <FileText className="w-2.5 h-2.5 shrink-0" />
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Chat Input form */}
                  <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 flex gap-2.5 bg-white">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder={disableEdits ? "Viewer mode: chatbot messaging disabled" : isGenerationBlocked ? "AI generations limit reached (10/10 runs)" : "Ask a question..."}
                      disabled={isChatSending || disableEdits || isGenerationBlocked}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-400 focus:bg-white rounded-xl text-xs outline-none transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!chatMessage.trim() || isChatSending || disableEdits || isGenerationBlocked}
                      title={disableEdits ? "Viewer mode: messaging disabled" : isGenerationBlocked ? "AI generation limit reached (10/10 runs)" : ""}
                      className="px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-75 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 12: Team OS & Collaboration */}
        {activeTab === 'team' && (
          <div id="tour-step-team-content" className="space-y-6 animate-fadeIn">
            {/* Header Card */}
            <div className="glass-panel border border-slate-200 p-8 rounded-3xl relative overflow-hidden bg-white">
              <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-50 rounded-2xl border border-violet-100 text-violet-600 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-800">Team Collaboration & Workspace Operations</h2>
                  <p className="text-slate-550 text-xs sm:text-sm mt-0.5">Manage team access, version control checkpoints, comment on assets, and audit workspace event trails.</p>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex border-b border-slate-200 mt-8 gap-6">
                {[
                  { id: 'members', name: 'Members & Invites' },
                  { id: 'versions', name: 'Version Control' },
                  { id: 'discussions', name: 'Discussion Board' },
                  { id: 'timeline', name: 'Timeline & Audits' },
                ].map((sTab) => (
                  <button
                    key={sTab.id}
                    onClick={() => {
                      setCollabSubTab(sTab.id as any);
                      if (sTab.id === 'timeline') fetchTimeline();
                    }}
                    className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
                      collabSubTab === sTab.id
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {sTab.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-tab: Members & Invites */}
            {collabSubTab === 'members' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Team Members List */}
                <div className="lg:col-span-8 glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Active Collaborators</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Users currently authorized to access and co-edit this workspace.</p>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 border border-slate-200 uppercase shrink-0">
                            {member.profiles?.full_name ? member.profiles.full_name[0] : (member.profiles?.email ? member.profiles.email[0] : 'U')}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{member.profiles?.full_name || 'Collaborator'}</h4>
                            <p className="text-[10px] text-slate-500">{member.profiles?.email}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          member.role === 'owner'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : member.role === 'admin'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : member.role === 'editor'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Invitations Section */}
                  <div className="pt-6 border-t border-slate-150 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pending Team Invitations</h3>
                      <p className="text-slate-550 text-xs mt-0.5">Invites sent that are currently awaiting acceptance by email.</p>
                    </div>

                    {pendingInvites.length > 0 ? (
                      <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-2">
                        {pendingInvites.map((invite) => (
                          <div key={invite.id} className="py-3.5 flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">{invite.email}</h4>
                              <p className="text-[9px] text-slate-550">
                                Role: <span className="font-semibold text-slate-700 uppercase">{invite.role}</span> • Status: <span className={`font-semibold capitalize ${
                                  invite.status === 'pending'
                                    ? 'text-yellow-600'
                                    : invite.status === 'accepted'
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                                }`}>{invite.status}</span>
                              </p>
                              {invite.status === 'pending' && (
                                <p className="text-[9px] text-slate-450 mt-0.5">
                                  Expires: {new Date(invite.expires_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {invite.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleCopy(`${window.location.origin}/invitations/${invite.id}`, invite.id)}
                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all text-slate-650"
                                  >
                                    {copiedText === invite.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy Link</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRevokeInvitation(invite.id)}
                                    disabled={disableEdits}
                                    className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-150 rounded-lg text-rose-600 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                                    title="Revoke invitation"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No pending invitations found.</p>
                    )}
                  </div>
                </div>

                {/* Invite Form */}
                <div className="lg:col-span-4 glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Invite Member</h3>
                    <p className="text-slate-550 text-xs mt-0.5">Add developers, editors, or stakeholders to this startup workspace.</p>
                  </div>

                  <form onSubmit={handleInviteMember} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="collaborator@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={disableEdits}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs bg-slate-50/50 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Workspace Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        disabled={disableEdits}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs bg-slate-50/50 disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <option value="viewer">Viewer (Read-only views)</option>
                        <option value="editor">Editor (Generates/Edits/Saves)</option>
                        <option value="admin">Admin (Full permissions except deletion)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isInviting || !inviteEmail || disableEdits}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:cursor-not-allowed"
                    >
                      {isInviting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Invite...</span>
                        </>
                      ) : (
                        <span>Send Invitation</span>
                      )}
                    </button>
                  </form>

                  {inviteUrlResult && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-fadeIn space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 uppercase">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        <span>Invitation Link Generated</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 leading-normal">
                        Share this link with your team member to let them join. It bypasses email SMTP requirements in this region:
                      </p>
                      <div className="flex items-center gap-1.5 bg-white border border-emerald-200 p-2 rounded-xl">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}${inviteUrlResult}`}
                          className="flex-1 text-[9px] bg-transparent border-none text-slate-700 focus:outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(`${window.location.origin}${inviteUrlResult}`, 'invite-copy')}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-650 transition-all shrink-0"
                          title="Copy invitation link"
                        >
                          {copiedText === 'invite-copy' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab: Version Control */}
            {collabSubTab === 'versions' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Snapshot Form */}
                <div className="lg:col-span-4 glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Create Checkpoint</h3>
                    <p className="text-slate-550 text-xs mt-0.5">Commit current configurations as a persistent snapshot rollback backup.</p>
                  </div>

                  <form onSubmit={handleCreateVersion} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Select Module</label>
                      <select
                        value={versionType}
                        onChange={(e) => setVersionType(e.target.value as any)}
                        disabled={disableEdits}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs bg-slate-50/50 disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <option value="branding">Branding Studio Profile</option>
                        <option value="marketing">Marketing Center Strategy</option>
                        <option value="finance">Financial Engine projections</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Version Label / Description</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Before marketing shift / Round A forecasts"
                        value={newVersionLabel}
                        onChange={(e) => setNewVersionLabel(e.target.value)}
                        disabled={disableEdits}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs bg-slate-50/50 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingVersion || !newVersionLabel || disableEdits}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:cursor-not-allowed"
                    >
                      {isCreatingVersion ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Snapshot...</span>
                        </>
                      ) : (
                        <span>Save Version Checkpoint</span>
                      )}
                    </button>
                  </form>
                </div>

                {/* Versions History List */}
                <div className="lg:col-span-8 glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Version History</h3>
                      <p className="text-slate-550 text-xs mt-0.5">Review and restore previous asset configurations.</p>
                    </div>

                    <div className="flex gap-2">
                      {['all', 'branding', 'marketing', 'finance'].map((vFilter) => (
                        <button
                          key={vFilter}
                          onClick={() => setVersionTypeFilter(vFilter as any)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase border transition-all ${
                            versionTypeFilter === vFilter
                              ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350 hover:text-slate-850'
                          }`}
                        >
                          {vFilter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {versionsList.filter((v) => versionTypeFilter === 'all' || v.version_type === versionTypeFilter).length > 0 ? (
                    <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2 space-y-3">
                      {versionsList
                        .filter((v) => versionTypeFilter === 'all' || v.version_type === versionTypeFilter)
                        .map((ver) => (
                          <div key={ver.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-850">v#{ver.version_number}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${
                                  ver.version_type === 'branding'
                                    ? 'bg-violet-50 border-violet-200 text-violet-700'
                                    : ver.version_type === 'marketing'
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}>
                                  {ver.version_type}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-700">{ver.label}</p>
                              <p className="text-[10px] text-slate-600 leading-normal">
                                Committed by: <span className="font-medium text-slate-600">{ver.profiles?.email || 'System'}</span> • {new Date(ver.created_at).toLocaleString()}
                              </p>
                            </div>

                            <button
                              onClick={() => handleRollback(ver.id)}
                              disabled={disableEdits}
                              className="px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white rounded-xl text-[10px] font-bold transition-all text-slate-750 flex items-center gap-1.5 shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>Rollback</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-6 text-center">No version checkpoints found for this category.</p>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab: Discussion Board */}
            {collabSubTab === 'discussions' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Post Comment Form */}
                <div className="lg:col-span-4 glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Add Comment</h3>
                    <p className="text-slate-550 text-xs mt-0.5">Post resource notes or feedback for your co-authors.</p>
                  </div>

                  <form onSubmit={handleSaveComment} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Resource Context</label>
                      <select
                        value={commentResource}
                        onChange={(e) => setCommentResource(e.target.value as any)}
                        disabled={disableEdits}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs bg-slate-50/50 disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <option value="report">Strategic Feasibility Report</option>
                        <option value="branding">Branding Assets Studio</option>
                        <option value="finance">Financial Projections Models</option>
                        <option value="roadmap">Launch & Growth Roadmap</option>
                        <option value="marketing">Marketing strategy campaigns</option>
                        <option value="pitchdeck">Founder Pitch Deck</option>
                        <option value="landingpage">Storefront Landing Page</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Comment Message</label>
                      <textarea
                        required
                        rows={4}
                        placeholder={disableEdits ? "Viewer mode: posting comments disabled" : "Write constructive notes..."}
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        disabled={disableEdits}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs bg-slate-50/50 resize-none disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAddingComment || !newCommentText || disableEdits}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:cursor-not-allowed"
                    >
                      {isAddingComment ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Posting comment...</span>
                        </>
                      ) : (
                        <span>Post Comment</span>
                      )}
                    </button>
                  </form>
                </div>

                {/* Discussions Feed */}
                <div className="lg:col-span-8 glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Discussion Stream</h3>
                    <p className="text-slate-550 text-xs mt-0.5">Timeline of collaborators comments across different modules.</p>
                  </div>

                  {commentsList.length > 0 ? (
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2 space-y-4">
                      {commentsList.map((comm) => (
                        <div key={comm.id} className="py-4 flex items-start gap-3 justify-between group/comment">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-150 flex items-center justify-center text-[10px] font-bold text-slate-700 border border-slate-250 uppercase shrink-0 mt-0.5">
                              {comm.profiles?.full_name ? comm.profiles.full_name[0] : (comm.profiles?.email ? comm.profiles.email[0] : 'U')}
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-800">{comm.profiles?.full_name || comm.profiles?.email || 'Collaborator'}</span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[8px] font-extrabold uppercase text-slate-650">
                                  {comm.resource_type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-650 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-2xl border border-slate-100">{comm.content}</p>
                              <span className="text-[9px] text-slate-400 block">{new Date(comm.created_at).toLocaleString()}</span>
                            </div>
                          </div>

                          {!disableEdits && (
                            <button
                              onClick={() => handleDeleteComment(comm.id)}
                              className="opacity-0 group-hover/comment:opacity-100 p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-150 rounded-lg text-rose-600 transition-all shrink-0 self-start"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-12 text-center">No discussion notes have been posted yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab: Timeline & Audits */}
            {collabSubTab === 'timeline' && (
              <div className="glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Workspace Activity Audit Trail</h3>
                  <p className="text-slate-550 text-xs mt-0.5">Verifiable log records of workspace creations, updates, AI calls, and collaborations.</p>
                </div>

                {isLoadingTimeline ? (
                  <div className="py-24 text-center text-xs text-slate-400 bg-white">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-violet-500" />
                    Fetching workspace event stream and logs...
                  </div>
                ) : timelineEvents.length > 0 ? (
                  <div className="relative pl-10 space-y-8 max-h-[500px] overflow-y-auto pr-2 py-4">
                    {/* Vertical timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
                    
                    {timelineEvents.map((evt, idx) => (
                      <div key={evt.id || idx} className="relative">
                        {/* Bullet circle */}
                        <div className={`absolute left-[-29px] top-1.5 w-2.5 h-2.5 rounded-full border-2 bg-white ${
                          evt.event_type === 'chat'
                            ? 'border-violet-500'
                            : evt.event_type === 'creation'
                            ? 'border-emerald-500'
                            : 'border-indigo-500'
                        }`} />
                        
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold tracking-wide uppercase">{new Date(evt.created_at || evt.timestamp).toLocaleString()}</span>
                          <h4 className="text-xs font-bold text-slate-800">{evt.title}</h4>
                          <p className="text-xs text-slate-550 leading-relaxed">{evt.description}</p>
                          {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                            <div className="mt-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] text-slate-500 font-mono w-fit max-w-full overflow-x-auto">
                              Metadata: {JSON.stringify(evt.metadata)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-12 text-center">No activity history registered yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 13: Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Workspace Settings</h3>
                <p className="text-slate-500 text-xs mt-0.5">Manage general configurations and controls for this workspace.</p>
              </div>

              {/* Danger Zone Card */}
              <div className="border border-red-200 rounded-2xl p-6 bg-red-50/20 space-y-4">
                <h4 className="text-xs font-bold text-red-700 flex items-center gap-1.5 uppercase tracking-wider">
                  Danger Zone
                </h4>
                <p className="text-xs text-red-650 leading-normal max-w-xl">
                  Permanently remove this workspace and purge all associated documents, version checkpoints, and AI co-founder analytics. This action cannot be undone.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-650 hover:bg-red-700 text-white disabled:opacity-75 text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? 'Deleting...' : 'Delete Workspace'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Tab 14: Support Ticketing */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full animate-fadeIn">
            {/* Left Column: List & Create Ticket Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6 w-full">
              {/* Submit Ticket Form */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-5 h-5 text-indigo-650" />
                  <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider">New Support Ticket</h3>
                </div>
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={userTicketSubject}
                      onChange={(e) => setUserTicketSubject(e.target.value)}
                      placeholder="e.g. Generation credit limit reached, billing query"
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-500 focus:outline-none text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Priority</label>
                    <select
                      value={userTicketPriority}
                      onChange={(e: any) => setUserTicketPriority(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none text-xs"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Details</label>
                    <textarea
                      value={userTicketMessage}
                      onChange={(e) => setUserTicketMessage(e.target.value)}
                      placeholder="Describe your request in detail..."
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-slate-800 placeholder:text-slate-500 focus:outline-none text-xs resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreatingTicket}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75"
                  >
                    {isCreatingTicket ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Submit Support Request'}
                  </button>
                </form>
              </div>

              {/* Past Tickets List */}
              <div className="glass-panel border border-slate-200 p-6 rounded-3xl bg-white space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Your Ticket History</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {userTickets.length === 0 ? (
                    <p className="text-xs text-slate-455 italic text-center py-6">No previous tickets registered.</p>
                  ) : (
                    userTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedUserTicketId(ticket.id)}
                        className={`p-3 border rounded-2xl cursor-pointer transition-all ${
                          selectedUserTicketId === ticket.id
                            ? 'border-indigo-500 bg-indigo-50/20'
                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">{ticket.subject}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            ticket.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : ticket.status === 'pending'
                              ? 'bg-amber-55 text-amber-700 border border-amber-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2.5 text-[9px] text-slate-450 font-medium">
                          <span>Priority: <span className="font-bold uppercase">{ticket.priority}</span></span>
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Ticket Conversation Detail (7 cols) */}
            <div className="lg:col-span-7 w-full">
              {selectedUserTicketId ? (
                (() => {
                  const activeTicket = userTickets.find(t => t.id === selectedUserTicketId);
                  if (!activeTicket) return null;
                  return (
                    <div className="glass-panel border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-sm flex flex-col h-[585px]">
                      {/* Ticket Header */}
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{activeTicket.subject}</h4>
                          <p className="text-[10px] text-slate-550 mt-0.5">Ticket ID: {activeTicket.id}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          activeTicket.status === 'resolved'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : activeTicket.status === 'pending'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}>
                          {activeTicket.status}
                        </span>
                      </div>

                      {/* Chat Messages Log */}
                      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/10">
                        {activeTicket.messages?.map((msg: any) => {
                          const isAdmin = msg.sender_type === 'admin';
                          return (
                            <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                              <div className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm text-xs ${
                                isAdmin
                                  ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                  : 'bg-slate-900 text-white rounded-tr-none'
                              }`}>
                                <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold uppercase opacity-75">
                                  <span>{isAdmin ? 'StartupOS Support' : 'You'}</span>
                                  <span>•</span>
                                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply Composer */}
                      {activeTicket.status !== 'resolved' ? (
                        <form onSubmit={handleSendUserReply} className="p-4 border-t border-slate-100 bg-white flex gap-3 items-center">
                          <input
                            type="text"
                            value={userTicketReplyText}
                            onChange={(e) => setUserTicketReplyText(e.target.value)}
                            placeholder="Type a message to support..."
                            className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingUserReply || !userTicketReplyText.trim()}
                            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl disabled:opacity-50 transition-colors"
                          >
                            {isSubmittingUserReply ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Select a Support Ticket</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Choose an active support ticket from the history list, or submit a new query to chat with the StartupOS support agents.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Guided Tour Contextual Overlay Tooltips */}
      {tourStep !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative animate-fadeIn flex flex-col justify-between min-h-[220px]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">
                Venture OS Tour — Step {tourStep} of 4
              </span>
              <button
                onClick={() => {
                  setTourStep(null);
                  localStorage.setItem(`tour-completed-${workspace.id}`, 'true');
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
              >
                Skip
              </button>
            </div>

            {/* Title & Description */}
            {tourStep === 1 && (
              <div className="space-y-2">
                <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Startup Readiness Score
                </h4>
                <p className="text-slate-605 text-[11px] leading-relaxed">
                  This circular score gauge dynamically aggregates feasibility, brand identity, marketing calendar, financial model, and knowledge completeness checkpoints. Complete activities to reach 100%!
                </p>
              </div>
            )}
            {tourStep === 2 && (
              <div className="space-y-2">
                <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  Specialist Workspace Modules
                </h4>
                <p className="text-slate-605 text-[11px] leading-relaxed">
                  Use the sidebar selectors to navigate planning modules. The AI co-founder generates branding assets, content strategies, financial models, and roll-out roadmaps.
                </p>
              </div>
            )}
            {tourStep === 3 && (
              <div className="space-y-2">
                <h4 className="font-sans font-bold text-slate-805 text-sm flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-violet-500" />
                  RAG Knowledge Base
                </h4>
                <p className="text-slate-605 text-[11px] leading-relaxed">
                  Upload documents here. Our system parses and indexes text in pgvector memory, automatically grounding future AI queries and generations in your proprietary context.
                </p>
              </div>
            )}
            {tourStep === 4 && (
              <div className="space-y-2">
                <h4 className="font-sans font-bold text-slate-805 text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  Team Collaboration & Auditing
                </h4>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  Under Team OS, invite collaborators, post notes, view audit trail event histories, save workspace checkpoints, and roll back modules to previous version snapshots.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
            <div className="flex gap-2">
              {tourStep > 1 && (
                <button
                  onClick={() => setTourStep((prev) => (prev ? prev - 1 : null))}
                  className="px-3 py-1.5 bg-slate-55 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition-all"
                >
                  Back
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (tourStep < 4) {
                  setTourStep((prev) => (prev ? prev + 1 : null));
                } else {
                  setTourStep(null);
                  localStorage.setItem(`tour-completed-${workspace.id}`, 'true');
                }
              }}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-[0.98]"
            >
              {tourStep === 4 ? 'Finish Tour' : 'Next'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    )}

    {demoTourStep !== null && (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative animate-fadeIn flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                Demo Tour — Step {demoTourStep} of 10
              </span>
              <button
                onClick={() => setDemoTourStep(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
              >
                Skip Tour
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
                {DEMO_TOUR_STEPS[demoTourStep - 1]?.title}
              </h4>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                {DEMO_TOUR_STEPS[demoTourStep - 1]?.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
            <div className="flex gap-2">
              {demoTourStep > 1 && (
                <button
                  onClick={() => setDemoTourStep((prev) => (prev ? prev - 1 : null))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition-all"
                >
                  Back
                </button>
              )}
            </div>
            {demoTourStep < 10 ? (
              <button
                onClick={() => setDemoTourStep((prev) => (prev ? prev + 1 : null))}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-[0.98]"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/signup"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-[0.98]"
              >
                <span>Get Started Free</span>
                <Sparkles className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Upgrade Modal */}
    <UpgradeModal
      isOpen={isUpgradeModalOpen}
      onClose={() => setIsUpgradeModalOpen(false)}
      title={upgradeModalTitle}
      message={upgradeModalMessage}
      limitType={upgradeModalLimitType}
    />

    {/* 3. Right Context Panel (collapsible comments) */}
    {isCommentDrawerOpen && (
      <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-6 overflow-y-auto space-y-6 animate-fadeIn flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contextual Notes</h3>
            <p className="text-slate-450 text-[10px] mt-0.5 font-medium leading-normal">Discussion thread for the active module.</p>
          </div>
          <InlineCommentsWidget
            workspaceId={workspace.id}
            resourceType={currentResourceType}
            comments={commentsList}
            onAddComment={handleAddInlineComment}
            onDeleteComment={handleDeleteInlineComment}
            disableEdits={disableEdits}
          />
        </div>
      </aside>
    )}
    </div>
  );
}


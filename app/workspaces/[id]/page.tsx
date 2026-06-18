import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';
import Link from 'next/link';
import { ArrowLeft, Shield, Sparkles } from 'lucide-react';
import AIOSLauncher from '@/components/AIOSLauncher';
import WorkspaceDashboardView from '@/components/WorkspaceDashboardView';
import { cookies } from 'next/headers';

export default async function WorkspacePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  let user: any = null;
  let currentUserProfile: { email: string; full_name?: string; avatar_url?: string } | null = null;
  let workspace: any = null;
  let report: any = null;
  let branding: any = null;
  let finance: any = null;
  let roadmap: any = null;
  let marketing: any = null;
  let competitors: any = [];
  let pitchDeck: any = null;
  let landingPage: any = null;
  let members: any[] = [];
  let invitations: any[] = [];
  let comments: any[] = [];
  let versions: any[] = [];
  let documents: any[] = [];

  if (isDemoMode) {
    user = { id: 'mock-user-id', email: 'demo-founder@startupos.ai' };
    currentUserProfile = {
      email: 'demo-founder@startupos.ai',
      full_name: 'Demo Founder',
      avatar_url: ''
    };
    workspace = {
      id: id,
      user_id: 'mock-user-id',
      name: id === 'demo-workspace-1' ? 'EcoThread India' : 'My New Startup',
      industry: 'Sustainable Fashion',
      description: 'A direct-to-consumer apparel brand bringing organic, affordable cotton clothing to Indian college campuses.',
      budget: 50000,
      stage: 'branding'
    };

    const cookieStore = await cookies();
    const isGenerated = id === 'demo-workspace-1' || cookieStore.get(`generated-${id}`)?.value === 'true';

    if (isGenerated) {
      report = {
        feasibility_score: 85,
        profitability_score: 78,
        difficulty_score: 45,
        market_demand: 'High demand for sustainable products among urban college youth.',
        competition_summary: 'Several niche brands exist, but few target college students directly with low-cost clothing.',
        risk_analysis: { supply_chain: 'Organic cotton supply constraints', mitigation: 'Partner with certified local farmers.' },
        swot_analysis: {
          strengths: ['Eco-friendly fabrics', 'Low production overhead'],
          weaknesses: ['High raw materials costs', 'Limited initial budget'],
          opportunities: ['Direct-to-consumer online sales', 'Social media marketing viral potential'],
          threats: ['Established fast fashion brands', 'Copycat competitors']
        },
        market_gaps: ['Affordable organic apparel', 'College-oriented marketing style'],
        differentiation_strategy: 'Provide certified organic clothing at price points competitive with standard cotton.'
      };
      branding = {
        brand_names: [
          { name: 'EcoThread India', justification: 'Direct and clear', availability: 'Available' },
          { name: 'GreenWear Co', justification: 'Focuses on environment', availability: 'Trademark conflict' }
        ],
        slogans: ['Wear your values', 'Organic. Affordable. Yours.'],
        positioning_statement: 'The first eco-friendly fashion brand made explicitly for Indian college students.',
        color_palette: { primary: '#10B981', secondary: '#6366F1', accent: '#F59E0B', background: '#090D16' },
        logo_prompts: ['A minimalist green leaf logo forming the letter E', 'Modern corporate typography with green tones'],
        brand_name: 'EcoThread India',
        tagline: 'Organic. Affordable. Yours.',
        brand_voice: 'Eco-conscious & Campus-centric',
        logo_prompt: 'A minimalist green leaf logo forming the letter E'
      };
      finance = {
        startup_costs: [
          { item: 'Inventory Production', cost: 30000 },
          { item: 'Website Deployment', cost: 5000 }
        ],
        revenue_projections: [15000, 18000, 22000, 26000, 30000, 35000, 42000, 50000, 60000, 72000, 85000, 100000],
        break_even_analysis: { fixed_monthly_overhead: 8000, revenue_per_unit: 800, margin_percentage: 60 },
        expense_forecasts: [10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000, 21000]
      };
      roadmap = {
        plan_30_day: [
          { week: 1, goal: 'Formulate supply chains', tasks: ['Contact fabric mills', 'Request sample swatches'] }
        ],
        plan_90_day: [
          { month: 1, target: 'Beta Launch website', sub_milestones: ['Setup Shopify storefront'] }
        ],
        launch_roadmap: ['Finalize designs', 'Order inventory batch', 'Deploy landing page'],
        growth_roadmap: ['Instagram influencer collabs', 'Campus ambassador programs']
      };
      marketing = {
        instagram_campaigns: [{ image_idea: 'Photo of student wearing green hoodie', caption: 'Eco fashion is here', hashtags: ['green', 'fashion'] }],
        linkedin_campaigns: [{ hook: 'How we built a sustainable apparel brand', body: 'Story details...' }],
        email_sequences: [{ subject: 'Welcome to EcoThread', body: 'Thank you for joining...', trigger_day: 1 }],
        ad_copy: { google: ['Affordable eco clothing'], meta: ['Feel good about what you wear'] },
        content_calendar: [{ day: 1, platform: 'instagram', topic: 'Brand launch announcement' }]
      };
      pitchDeck = {
        problem_statement: 'Fast fashion is highly polluting and standard cotton uses toxic chemicals. Affordable eco-friendly campus clothing does not exist in India.',
        solution: 'Direct-to-consumer print-on-demand organic campus streetwear, locally sourced and competitively priced.',
        market_size: { tam: '₹5,000 Cr (Indian Gen-Z clothing market)', sam: '₹800 Cr (College student streetwear)', som: '₹12 Cr (Target campuses in Year 1-2)' },
        business_model: 'Direct e-commerce sales, campus reps micro-commission, and limited drop merch runs.',
        go_to_market: 'Establish college student freelancer referral loops, flash sales on WhatsApp/Instagram, and ambassador program.',
        slides: [
          { title: 'The Problem', content: 'Fast fashion is highly polluting. Students want eco-conscious clothing but cannot afford standard premium brands.', visual_layout_suggestion: 'Left side problem text bullet points. Right side graphical footprint chart.' },
          { title: 'The Solution', content: 'EcoThread India: affordable organic cotton streetwear sold directly via college ambassador networks.', visual_layout_suggestion: 'Centred product mockups with sustainability badges.' }
        ]
      };
      landingPage = {
        hero: {
          title: 'Direct-to-Consumer Organic Campus Wear',
          subtitle: 'Sustainable fashion made affordable for Indian college students. Feel good, look sharp, and protect the planet.',
          cta_text: 'Browse Collections',
          cta_url: '#collections'
        },
        features: [
          { title: '100% Certified Organic', description: 'GOTS certified organic cotton sourced from local cooperative farms in India.', icon: 'Leaf' },
          { title: 'Affordable Streetwear', description: 'Zero reseller overhead means direct pricing competitive with fast-fashion.', icon: 'Tag' },
          { title: 'Ambassador Network', description: 'WhatsApp loops and student reps make ordering and peer deliveries instant.', icon: 'Users' }
        ],
        pricing: [
          { name: 'Eco Rep Tee', price: '₹499', period: 'one-time', features: ['100% Organic Cotton', 'Screen printed label', 'Free campus delivery'], is_popular: false, button_text: 'Pre-order Tee' },
          { name: 'Campus Hoodie', price: '₹1,299', period: 'one-time', features: ['Heavyweight fleece', 'Embroidered leaf logo', 'Priority WhatsApp support'], is_popular: true, button_text: 'Pre-order Hoodie' },
          { name: 'Squad Pack', price: '₹2,499', period: 'one-time', features: ['3 custom tees', '1 hoodie', 'Free canvas tote bag'], is_popular: false, button_text: 'Pre-order Bundle' }
        ],
        testimonials: [
          { name: 'Aarav Sharma', role: 'Campus Rep', company: 'Delhi University', content: 'EcoThread hoodies are incredibly soft. All my classmates are pre-ordering because they want sustainable clothing that fits their budget!' },
          { name: 'Ananya Iyer', role: 'Student Designer', company: 'NIFT Mumbai', content: 'It is amazing to see a brand focus on local farm cooperatives while keeping streetwear aesthetics super fresh and relevant.' }
        ],
        faqs: [
          { question: 'Is the cotton truly organic?', answer: 'Yes! We only use GOTS (Global Organic Textile Standard) certified cotton sourced from ethical local farmers.' },
          { question: 'How does campus delivery work?', answer: 'Our student ambassadors distribute orders directly at campus hotspots, saving you shipping costs!' }
        ],
        code: `// Next.js Landing Page Component Generated by StartupOS AI`
      };
      members = [
        { id: '1', role: 'owner', profiles: { email: 'demo-founder@startupos.ai', full_name: 'Demo Founder' } },
        { id: '2', role: 'admin', profiles: { email: 'admin-collab@startupos.ai', full_name: 'Admin Collaborator' } }
      ];
      invitations = [
        { id: '1', email: 'editor-collab@startupos.ai', role: 'editor', status: 'pending', expires_at: new Date(Date.now() + 3600000 * 24 * 5).toISOString() }
      ];
      comments = [
        { id: '1', resource_type: 'report', content: 'This market analysis looks super promising.', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), profiles: { email: 'admin-collab@startupos.ai', full_name: 'Admin Collaborator' } }
      ];
      versions = [
        { id: '1', version_type: 'branding', version_number: 1, label: 'Initial Branding profile', created_at: new Date(Date.now() - 3600000 * 4).toISOString(), profiles: { email: 'demo-founder@startupos.ai', full_name: 'Demo Founder' } }
      ];
      competitors = [
        {
          id: 'mock-comp-1',
          workspace_id: id,
          name: 'OrganicSutra Apparel',
          website: 'https://organicsutra.in',
          market_share: '12%',
          strengths: ['Strong national organic brand awareness', 'Established supply chain partnerships'],
          weaknesses: ['Premium pricing tier (high cost)', 'Lacks targeted marketing for college students'],
          estimated_pricing: '₹1,200 - ₹2,500 per t-shirt/apparel',
          differentiation: 'We offer college-centric urban designs at half the price (₹499 - ₹899) with direct campus distribution.'
        },
        {
          id: 'mock-comp-2',
          workspace_id: id,
          name: 'CampusWear Co',
          website: 'https://campuswear.co.in',
          market_share: '25%',
          strengths: ['Low cost points', 'Strong bulk campus distribution channels'],
          weaknesses: ['Non-organic standard cotton', 'Low brand loyalty, generic designs'],
          estimated_pricing: '₹350 - ₹700 per apparel',
          differentiation: 'We offer premium certified organic fabric and vibrant street-wear style, which they lack entirely.'
        },
        {
          id: 'mock-comp-3',
          workspace_id: id,
          name: 'EcoThreads International',
          website: 'https://ecothreads.com',
          market_share: '5%',
          strengths: ['Highly certified sustainable loop fabric', 'Excellent brand aesthetics'],
          weaknesses: ['Imported products (high shipping costs)', 'Slow delivery times (7-14 days) to India'],
          estimated_pricing: '₹2,000+ per t-shirt',
          differentiation: 'We manufacture locally in India, enabling next-day delivery and affordable regional pricing.'
        }
      ];
      documents = [
        { id: '1', name: 'Gen-Z Campus Merch Plan.pdf', file_size: 45200, mime_type: 'application/pdf', created_at: new Date().toISOString() }
      ];
    }
  } else {
    const supabase = await createClient();
    const {
      data: { user: dbUser },
    } = await supabase.auth.getUser();
    user = dbUser;

    if (!user) {
      redirect('/login');
    }

    const [
      { data: dbWorkspace, error: wsError },
      { data: dbReport },
      { data: dbBranding },
      { data: dbFinance },
      { data: dbRoadmap },
      { data: dbMarketing },
      { data: dbCompetitors },
      { data: dbPitchDeck },
      { data: dbLandingPage },
      { data: dbMembers },
      { data: dbInvites },
      { data: dbComments },
      { data: dbVersions },
      { data: dbDocuments }
    ] = await Promise.all([
      supabase.from('workspaces').select('*').eq('id', id).single(),
      supabase.from('startup_reports').select('*').eq('workspace_id', id).maybeSingle(),
      supabase.from('branding_assets').select('*').eq('workspace_id', id).maybeSingle(),
      supabase.from('financial_projections').select('*').eq('workspace_id', id).maybeSingle(),
      supabase.from('roadmaps').select('*').eq('workspace_id', id).maybeSingle(),
      supabase.from('marketing_plans').select('*').eq('workspace_id', id).maybeSingle(),
      supabase.from('competitors').select('*').eq('workspace_id', id),
      supabase.from('pitch_decks').select('*').eq('workspace_id', id).maybeSingle(),
      (async () => {
        try {
          return await supabase.from('landing_pages').select('*').eq('workspace_id', id).maybeSingle();
        } catch (e) {
          return { data: null, error: null };
        }
      })(),
      supabase.from('workspace_members').select('*, profiles(email, full_name)').eq('workspace_id', id),
      supabase.from('workspace_invitations').select('*').eq('workspace_id', id),
      supabase.from('comments').select('*, profiles(email, full_name)').eq('workspace_id', id).order('created_at', { ascending: true }),
      supabase.from('workspace_versions').select('*, profiles!created_by(email, full_name)').eq('workspace_id', id).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('workspace_id', id)
    ]);

    if (wsError || !dbWorkspace) {
      redirect('/');
    }

    const isOwner = dbWorkspace.user_id === user.id;
    const isMember = dbMembers && dbMembers.some((m: any) => m.user_id === user.id);

    if (!isOwner && !isMember) {
      redirect('/');
    }

    workspace = dbWorkspace;
    report = dbReport;
    branding = dbBranding;
    finance = dbFinance;
    roadmap = dbRoadmap;
    marketing = dbMarketing;
    competitors = dbCompetitors || [];
    pitchDeck = dbPitchDeck;
    landingPage = dbLandingPage;
    members = dbMembers || [];
    invitations = dbInvites || [];
    comments = dbComments || [];
    documents = dbDocuments || [];

    const { data: dbProfile } = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('id', user.id)
      .single();

    currentUserProfile = {
      email: dbProfile?.email || user.email || '',
      full_name: dbProfile?.full_name || user.user_metadata?.full_name || '',
      avatar_url: dbProfile?.avatar_url || user.user_metadata?.avatar_url || ''
    };
  }

  // Determine user role and billing limit details
  let userRole: 'owner' | 'admin' | 'editor' | 'viewer' = 'viewer';
  let planType: 'free' | 'pro' | 'team' = 'free';
  let generationCount = 0;
  let generationLimit = 10;

  if (isDemoMode) {
    userRole = id === 'demo-workspace-1' ? 'viewer' : 'owner';
    planType = 'free';
    generationCount = id === 'demo-workspace-1' ? 10 : 3;
  } else if (user) {
    const isOwner = workspace.user_id === user.id;
    if (isOwner) {
      userRole = 'owner';
    } else {
      const currentMember = members.find((m: any) => m.user_id === user.id);
      userRole = currentMember?.role || 'viewer';
    }

    // Load active plan from subscriptions
    const { getUserSubscription, checkUsageLimit } = await import('@/app/billing-actions');
    const sub = await getUserSubscription();
    planType = sub?.plan_type || 'free';

    // Query AI generation metrics count
    const limitCheck = await checkUsageLimit('generation', undefined, user.id);
    generationCount = limitCheck.count || 0;
    generationLimit = limitCheck.limit || 10;
  }

  // Check if AI generation exists (using report presence as the proxy)
  const isGenerated = !!report;

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
              Workspace Dashboard
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

      {/* Main OS Panel */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
              <span>Workspace</span>
              <span>•</span>
              <span className="text-slate-600">{workspace.industry}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 flex items-center gap-2.5">
              {workspace.name}
              {isGenerated && (
                <span className="p-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  AI Co-founder active
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* View switching state logic */}
        {isGenerated ? (
          <WorkspaceDashboardView
            key={workspace.id}
            workspace={workspace}
            report={report}
            branding={branding}
            finance={finance}
            roadmap={roadmap}
            marketing={marketing}
            competitors={competitors}
            pitchDeck={pitchDeck}
            landingPage={landingPage}
            members={members}
            invitations={invitations}
            comments={comments}
            versions={versions}
            documents={documents}
            isReadOnly={isDemoMode && id === 'demo-workspace-1'}
            userRole={userRole}
            planType={planType}
            generationCount={generationCount}
            generationLimit={generationLimit}
            currentUserProfile={currentUserProfile || undefined}
          />
        ) : (
          <div className="py-12">
            <AIOSLauncher workspaceId={id} workspaceName={workspace.name} />
          </div>
        )}
      </main>
    </div>
  );
}

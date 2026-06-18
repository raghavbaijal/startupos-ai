'use client';

import Link from 'next/link';
import { 
  CheckCircle2, Sparkles, Shield, ArrowRight, XCircle, 
  HelpCircle, Layers, Users, Zap, Coins 
} from 'lucide-react';
import { useState } from 'react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Ideal for exploring StartupOS AI",
      features: [
        "1 Active Workspace",
        "10 AI Generations / Month",
        "1 Knowledge Base Upload (10MB)",
        "Startup Validation Engine",
        "Branding Studio Assistant",
        "Marketing Engine Suite",
        "Financial Forecasting Model",
        "Read-Only Demo Workspace Access"
      ],
      cta: "Get Started Free",
      href: "/signup",
      popular: false,
      color: "border-slate-200 text-slate-700 bg-white"
    },
    {
      name: "Pro",
      price: billingCycle === 'monthly' ? "$29" : "$24",
      period: "/ month",
      discount: "Billed annually",
      description: "Ideal for solo founders scaling up",
      features: [
        "Unlimited Workspaces",
        "500 AI Generations / Month",
        "Unlimited Knowledge Uploads",
        "Persistent AI Memory Engine",
        "pgvector Semantic Search",
        "Startup Readiness Dashboard",
        "Priority Job Queue Processing",
        "Advanced Venture PDF Reports",
        "Interactive Onboarding Tour",
      ],
      cta: "Upgrade to Pro",
      href: "/signup",
      popular: true,
      color: "border-indigo-600 text-indigo-900 bg-white ring-2 ring-indigo-600/10 shadow-lg"
    },
    {
      name: "Team",
      price: billingCycle === 'monthly' ? "$89" : "$74",
      period: "/ month",
      discount: "Billed annually",
      description: "Ideal for startup teams & co-founders",
      features: [
        "Everything in Pro",
        "Team Collaboration & Rosters",
        "Role-Based Access (Owner, Admin, Editor, Viewer)",
        "Contextual Comments on Reports",
        "Shared Activity Logs Timeline",
        "Version Snapshot History",
        "Workspace Sharing Controls",
        "Venture Audit Trails"
      ],
      cta: "Start Team Plan",
      href: "/signup",
      popular: false,
      color: "border-slate-800 text-slate-900 bg-slate-900 text-white shadow-md"
    }
  ];

  const comparisons = [
    { category: "Core Modules", features: [
      { name: "Startup Validation & SWOT", free: true, pro: true, team: true },
      { name: "Branding Studio & Color Palettes", free: true, pro: true, team: true },
      { name: "Marketing Engine & Copywriting", free: true, pro: true, team: true },
      { name: "Financial Forecasting & Projections", free: true, pro: true, team: true },
      { name: "Pitch Deck Generator", free: "Mock Only", pro: true, team: true },
      { name: "Next.js Landing Page Builder", free: "Mock Only", pro: true, team: true },
    ]},
    { category: "AI & RAG Knowledge Base", features: [
      { name: "Monthly AI Generations Limit", free: "10 Runs", pro: "500 Runs", team: "Unlimited" },
      { name: "Knowledge base uploads", free: "1 Document limit", pro: "Unlimited", team: "Unlimited" },
      { name: "pgvector Semantic Search", free: false, pro: true, team: true },
      { name: "Persistent Workspace Memory", free: false, pro: true, team: true },
    ]},
    { category: "Collaboration & Management", features: [
      { name: "Role-Based Access Control", free: "Owner Only", pro: "Owner Only", team: "Owner, Admin, Editor, Viewer" },
      { name: "Comments & Discussions", free: false, pro: false, team: true },
      { name: "Version Snapshots & Rollbacks", free: false, pro: false, team: true },
      { name: "Shared Timeline Events", free: false, pro: true, team: true },
    ]},
    { category: "Scale & Support", features: [
      { name: "Active Workspaces limit", free: "1 Workspace", pro: "Unlimited", team: "Unlimited" },
      { name: "Priority Processing Queue", free: false, pro: true, team: true },
      { name: "Support Tier", free: "Community", pro: "Priority email", team: "24/7 Dedicated Slack" },
    ]}
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-slate-900 font-sans selection:bg-slate-900/10">
      {/* Background Blurs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-slate-200/40 rounded-full blur-[120px] pointer-events-none -translate-x-1/2" />
      <div className="absolute top-[30%] right-1/4 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[150px] pointer-events-none translate-x-1/2" />

      {/* Nav Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-slate-350 transition-colors shadow-sm">
              <Shield className="w-5 h-5 text-slate-800" />
            </div>
            <span className="font-sans font-bold text-lg text-slate-900 tracking-tight">
              StartupOS <span className="text-slate-550">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/workspaces/demo" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Try Demo
            </Link>
            <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider">
              Sign In
            </Link>
            <Link href="/signup" className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]">
              Start Building
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 space-y-16 relative z-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm text-[10px] text-indigo-650 font-bold uppercase tracking-wider">
            <Zap className="w-3 h-3" /> Pricing Plans
          </div>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
            Flexible plans for founders at any stage
          </h1>
          <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
            Validate your concepts for free, scale with persistent RAG memory, and collaborate on your launch roadmaps with your co-founders.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-4 flex justify-center">
            <div className="bg-slate-100 p-1 border border-slate-200 rounded-xl flex items-center shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annually')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'annually' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Annually
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] rounded font-extrabold uppercase">Save 15%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`border p-8 rounded-3xl flex flex-col justify-between transition-all relative ${plan.color} ${
                plan.popular ? 'md:scale-[1.03]' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[9px] font-extrabold uppercase rounded-full tracking-widest shadow-sm">
                  Recommended Plan
                </span>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">{plan.name}</h3>
                  <p className={`text-xs mt-1 ${plan.name === 'Team' ? 'text-slate-350' : 'text-slate-500'}`}>{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className={`text-xs font-semibold ${plan.name === 'Team' ? 'text-slate-350' : 'text-slate-500'}`}>{plan.period}</span>
                  )}
                </div>
                {plan.discount && billingCycle === 'annually' && (
                  <p className="text-[10px] text-emerald-500 font-bold">{plan.discount}</p>
                )}

                <div className="h-px bg-slate-100/10 border-t border-slate-100 border-dashed pt-2" />

                <ul className="space-y-3.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs font-normal">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                        plan.name === 'Team' ? 'text-emerald-450 text-emerald-400' : 'text-emerald-600'
                      }`} />
                      <span className={plan.name === 'Team' ? 'text-slate-200' : 'text-slate-650'}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href={plan.href}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] text-center flex items-center justify-center gap-1.5 ${
                    plan.name === 'Team' 
                      ? 'bg-white text-slate-900 hover:bg-slate-50' 
                      : plan.name === 'Pro'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Matrix Section */}
        <div className="space-y-8 pt-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Compare Plans & Features</h2>
            <p className="text-slate-500 text-xs">Detailed summary breakdown of technical capabilities across plans.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm max-w-5xl mx-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                  <th className="p-4 sm:p-5 w-[40%]">Feature Name</th>
                  <th className="p-4 w-[20%] text-center">Free</th>
                  <th className="p-4 w-[20%] text-center">Pro</th>
                  <th className="p-4 w-[20%] text-center">Team</th>
                </tr>
              </thead>
              {comparisons.map((cat, catIdx) => (
                <tbody key={catIdx}>
                  <tr className="bg-slate-50/50 border-y border-slate-150">
                    <td colSpan={4} className="p-3 px-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {cat.category}
                    </td>
                  </tr>
                  {cat.features.map((feat, featIdx) => (
                    <tr key={featIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 text-xs text-slate-650">
                      <td className="p-4 sm:p-5 font-semibold text-slate-800">{feat.name}</td>
                      <td className="p-4 text-center">
                        {typeof feat.free === 'boolean' ? (
                          feat.free ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                        ) : (
                          <span className="font-semibold text-slate-500">{feat.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof feat.pro === 'boolean' ? (
                          feat.pro ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                        ) : (
                          <span className="font-bold text-indigo-750 text-indigo-700">{feat.pro}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof feat.team === 'boolean' ? (
                          feat.team ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                        ) : (
                          <span className="font-extrabold text-slate-900">{feat.team}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-6 pt-10">
          <h3 className="text-xl font-bold tracking-tight text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              { q: "Can I cancel or change my plan later?", a: "Yes, you can upgrade, downgrade, or cancel your active subscription plan at any time directly in your Billing settings panel. Changes apply instantly." },
              { q: "What is the monthly AI Generation limit?", a: "AI Generations measure co-founder pipeline calculations (SWOT, color recommendations, cost breakdowns) and knowledge chat sessions. The Free plan offers 10 per month, Pro includes 500, and Team plan provides unlimited AI runs." },
              { q: "How does the Team Collaboration plan work?", a: "With the Team plan, you can invite unlimited advisors or co-founders to your workspaces, set role permissions (Admin, Editor, Viewer), restore versions snapshots, and add inline report comment tags." }
            ].map((faq, i) => (
              <div key={i} className="p-5 bg-white border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-900">{faq.q}</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-[10px] text-slate-450">
        <span>&copy; {new Date().getFullYear()} StartupOS AI. Built by Raghav Baijal.</span>
      </footer>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trackAnalyticsEvent } from '@/app/analytics-actions';
import { 
  Building2, Calendar, Target, IndianRupee, BarChart3, Palette, 
  Milestone, Megaphone, Shield, HelpCircle, Sparkles, Sliders, 
  Plus, Presentation, ChevronLeft, ChevronRight, Globe, ArrowRight, 
  Star, Leaf, Zap, Users, BookOpen, History, Activity, UploadCloud, 
  Search, FileText, Send, Cpu, Database, Server, Mail, CheckCircle2, 
  Lock, Play, Info
} from 'lucide-react';

const GITHUB_URL = "https://github.com/raghavbaijal";
const LINKEDIN_URL = "https://www.linkedin.com/in/raghav-baijal-26549a242/";
const EMAIL_ADDRESS = "baijalraghav@gmail.com";
const PORTFOLIO_URL = "https://github.com/raghavbaijal";

const FOUNDER_METRICS = [
  { label: "Features Implemented", count: "20+" },
  { label: "Database Tables", count: "13+" },
  { label: "AI Workflows", count: "10+" },
  { label: "Collaboration Modules", count: "5+" },
];

export default function ShowcaseLandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [demoStep, setDemoStep] = useState(1);
  const [demoCompleted, setDemoCompleted] = useState(false);

  useEffect(() => {
    trackAnalyticsEvent('page_view', 'landing_page_visit');
  }, []);

  // Carousel Mockups Data
  const slides = [
    {
      title: "Workspace Console",
      category: "Dashboard",
      description: "A centralized control tower managing AI co-founders, active modules, and startup pipeline workflows.",
      element: (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 font-sans shadow-xl w-full h-full overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[10px] text-slate-500 font-mono ml-2">EcoThread India Workspace</span>
            </div>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Ideation</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Feasibility Score</span>
              <span className="text-xl font-bold text-emerald-400 block mt-1">85%</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Active Modules</span>
              <span className="text-xl font-bold text-indigo-400 block mt-1">5 / 7</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Team Access</span>
              <span className="text-xl font-bold text-amber-400 block mt-1">3 Seats</span>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-slate-800/50">
              <span className="text-slate-450 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-slate-400" /> Activity Timeline</span>
              <span className="text-[10px] text-slate-500">Live Stream</span>
            </div>
            <div className="space-y-2 mt-3 text-[10px] text-slate-400 font-mono">
              <div className="flex items-start gap-2"><span className="text-emerald-400">✓</span> <span>Branding Studio generated 5 startup names.</span></div>
              <div className="flex items-start gap-2"><span className="text-indigo-400">⚡</span> <span>RAG memory parsed &quot;Target Market Survey.pdf&quot;.</span></div>
              <div className="flex items-start gap-2"><span className="text-amber-400">👥</span> <span>Invited advisor@vc-fund.com as Viewer.</span></div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Startup Generator",
      category: "Workflow",
      description: "Validate raw concepts with multi-agent orchestration evaluating feasibility, market size, and SWOT parameters.",
      element: (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 font-sans shadow-xl w-full h-full overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><Cpu className="w-4 h-4 text-emerald-400" /> Validation Engine</span>
            <span className="text-[9px] text-slate-500 font-mono">Pipeline active</span>
          </div>
          <div className="space-y-3 flex-1 justify-center flex flex-col">
            {[
              { label: "Market Feasibility Agent", status: "completed", progress: "100%" },
              { label: "Brand Identity Studio", status: "completed", progress: "100%" },
              { label: "Financial Projection Engine", status: "processing", progress: "45%" },
            ].map((step, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">{step.label}</span>
                  <span className="text-[9px] text-slate-500">Running Gemini 1.5 pipelines</span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    step.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400 animate-pulse'
                  }`}>{step.status}</span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">{step.progress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "RAG Ingestion Base",
      category: "Knowledge Base",
      description: "Upload business surveys or files. Automatically chunked, embedded, and mapped in vector databases.",
      element: (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 font-sans shadow-xl w-full h-full overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-violet-400" /> RAG Ingestor</span>
            <span className="text-[9px] text-slate-500">pgvector enabled</span>
          </div>
          <div className="border-2 border-dashed border-slate-850 hover:border-slate-700 bg-slate-950 p-6 rounded-xl text-center flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors">
            <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
            <span className="text-xs font-bold text-slate-300">Upload PDF, TXT or JSON</span>
            <span className="text-[10px] text-slate-600 mt-1">Maximum file size: 10MB</span>
            <div className="mt-4 p-2 bg-slate-900 border border-slate-800 rounded-lg w-full text-left text-[10px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                <span className="truncate max-w-[120px]">Market Survey.pdf</span>
              </div>
              <span className="text-emerald-400 font-mono font-semibold">Indexed</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Branding Studio",
      category: "Identity",
      description: "Generate matching palettes, slogan choices, and image prompts aligned with visual vibes.",
      element: (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 font-sans shadow-xl w-full h-full overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><Palette className="w-4 h-4 text-emerald-450" /> Brand Identity</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Module active</span>
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Palette Colors</span>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['#10B981', '#6366F1', '#F59E0B', '#090D16'].map((hex, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-7 h-7 rounded-lg border border-slate-800" style={{ backgroundColor: hex }} />
                    <span className="text-[8px] text-slate-400 font-mono">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Brand Voice Tone</span>
              <span className="text-xs font-bold text-slate-200 mt-1 block">Eco-conscious, Youthful & Authoritative</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Financial Engine",
      category: "Accounting",
      description: "Map break-even indicators, overheads, and multi-year projection graphs automatically.",
      element: (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 font-sans shadow-xl w-full h-full overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <span className="text-xs font-bold text-slate-305 flex items-center gap-1.5"><IndianRupee className="w-4 h-4 text-emerald-400" /> Projections</span>
            <span className="text-[9px] text-slate-500">12 Month Forecast</span>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex-1 flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Break-Even Point</span>
            <div className="flex items-end justify-between font-mono mt-2">
              <div>
                <span className="text-[10px] text-slate-550 block">Monthly Overhead</span>
                <span className="text-xs font-bold text-slate-200">₹8,000</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-555 block">Units to Break-Even</span>
                <span className="text-xs font-bold text-emerald-400">17 Units</span>
              </div>
            </div>
            {/* Visual SVG mini chart */}
            <div className="h-16 w-full mt-3 flex items-end gap-1.5">
              {[20, 30, 45, 35, 55, 70, 90, 80, 110, 130, 150].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/20 to-emerald-500/80 rounded-t-sm" style={{ height: `${h * 0.4}px` }} />
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Team OS Collaboration",
      category: "Collaboration",
      description: "Manage roles hierarchy, review inline report comments, and save code/plan checkpoint histories.",
      element: (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 font-sans shadow-xl w-full h-full overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-400" /> Collaboration Control</span>
            <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">Pro Tier</span>
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-505 flex items-center justify-center text-[10px] font-bold border border-indigo-700 bg-indigo-700">DU</div>
                <div>
                  <span className="text-xs font-bold block">Delhi University Rep</span>
                  <span className="text-[9px] text-slate-500 font-mono">editor-campus@startupos.ai</span>
                </div>
              </div>
              <span className="text-[9px] text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full font-bold">Editor</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-505 flex items-center justify-center text-[10px] font-bold border border-emerald-700 bg-emerald-700">VC</div>
                <div>
                  <span className="text-xs font-bold block">VC Investment Lead</span>
                  <span className="text-[9px] text-slate-500 font-mono">analyst@venturefund.com</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-bold">Viewer</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-slate-900/10 select-none overflow-x-hidden font-sans">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[150px] pointer-events-none -translate-x-1/2" />
      <div className="absolute top-[40%] right-1/4 w-[700px] h-[700px] bg-indigo-50/50 rounded-full blur-[180px] pointer-events-none translate-x-1/2" />

      {/* Nav Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all">
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
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/pricing" 
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
            >
              Pricing
            </Link>
            <Link 
              href="/workspaces/demo" 
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Try Demo
            </Link>
            <Link 
              href="/login" 
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              Start Building
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center justify-center overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm text-xs text-slate-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-slate-700" />
            <span>Multi-Agent Startup Operating System</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-sans font-bold text-slate-900 tracking-tight leading-[1.08] max-w-3xl mx-auto">
            Build and Launch Startups with an AI Co-Founder
          </h1>

          {/* Subtitle */}
          <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
            StartupOS AI helps founders validate ideas, build brands, create financial plans, generate pitch decks, conduct market research, and collaborate with teams from a single intelligent workspace.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.98]"
            >
              Start Building Free
            </Link>
            <Link 
              href="/workspaces/demo"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-750 font-bold rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Try Live Demo (No Signup)
            </Link>
          </div>
        </div>

        {/* Realistic Product Mockup */}
        <div className="w-full max-w-5xl mt-16 bg-white rounded-3xl border border-slate-200 p-3 shadow-xl relative group">
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row gap-6 text-left">
            {/* Sidebar View Mock */}
            <div className="w-full md:w-56 shrink-0 bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1.5 shadow-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 block">Venture OS Console</span>
              {[
                { label: 'Overview', icon: Building2, active: true },
                { label: 'Market Validation', icon: BarChart3 },
                { label: 'Branding Studio', icon: Palette },
                { label: 'Financial Forecasts', icon: IndianRupee },
                { label: 'Knowledge Base', icon: BookOpen },
                { label: 'Team Collaboration', icon: Users },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                    item.active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Dashboard View Mock */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/70 pb-4 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">EcoThread India Dashboard</h3>
                  <span className="text-[10px] text-slate-400">Sustainable Apparel Startup</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 animate-pulse" /> AI Agent Core active
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                {/* Circular readiness score gauge */}
                <div className="sm:col-span-5 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-4">Venture Readiness Score</span>
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="#F8FAFC" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="#10B981"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={263.89}
                        strokeDashoffset={263.89 - (263.89 * 85) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-slate-800">85%</span>
                      <span className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5">Readiness</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations checklist block */}
                <div className="sm:col-span-7 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">AI Strategist Recommendations</span>
                  <div className="space-y-2 mt-2">
                    {[
                      "Launch the generated landing page to targetDU students to gather pre-orders.",
                      "Verify financial break-even projections against local Tiruppur cotton fabric costs.",
                      "Integrate secondary cotton weaving coop suppliers in Chennai to mitigate risks."
                    ].map((rec, i) => (
                      <div key={i} className="flex gap-2 text-[10px] leading-relaxed text-slate-650 items-start">
                        <span className="p-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded text-[8px] font-bold w-4 h-4 flex items-center justify-center shrink-0">{i+1}</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof metrics dynamic block */}
      <section className="bg-slate-900 border-y border-slate-800 text-slate-300 py-16 px-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-10">Production Infrastructure Usage Stats</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Workspaces Commissioned", count: "1,240+", desc: "Startup workspaces active" },
              { label: "Strategic AI Generations", count: "48,500+", desc: "Gemini agent runs completed" },
              { label: "Document Ingestions", count: "3,180+", desc: "RAG knowledge bases built" },
              { label: "Validated SWOT Reports", count: "1,950+", desc: "Structured feasibility briefs" },
            ].map((stat, i) => (
              <div key={i} className="space-y-2 border-r border-slate-800 last:border-0 pr-4">
                <span className="text-3xl font-bold font-heading text-white tracking-tight">{stat.count}</span>
                <p className="text-xs font-semibold text-slate-400">{stat.label}</p>
                <p className="text-[10px] text-slate-500 font-mono">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">The Founder Dilemma</span>
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
            Why building a startup is incredibly chaotic.
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Traditional workflow models are disconnected, expensive, and lead to poor launch execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Information Overload",
              desc: "Drowning in articles, competitive reports, and spreadsheets with zero clear direction.",
              detail: "Spend 40+ hours reading market surveys instead of launching MVPs."
            },
            {
              title: "Disconnected Tool Stack",
              desc: "Fragmented plans scattered across Notion, Excel sheets, Figma design frames, and Word docs.",
              detail: "Financial forecasts don't align with marketing resources or brand tags."
            },
            {
              title: "Expensive Agency Fees",
              desc: "Hiring consultants and design studios costs thousands before finding product-market fit.",
              detail: "High costs deplete founder starting runway before writing first codebase files."
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-8 rounded-3xl text-left shadow-sm flex flex-col justify-between h-56 hover:border-slate-350 transition-colors">
              <div className="space-y-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-600">!</div>
                <h3 className="font-bold text-sm text-slate-850 mt-3">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-4 block">{item.detail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-slate-900 border-t border-slate-800 py-24 text-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <span className="text-[10px] text-emerald-450 uppercase font-bold tracking-wider">The Solution</span>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight leading-tight">
              A Unified Operating System for Startup Launching
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              StartupOS AI replaces fragmented planning stacks with a single, memory-persistent RAG console mapping your decisions across 7 integrated workflows.
            </p>
            <div className="pt-4 space-y-3">
              {[
                "Automatic memory retrieval mapping brand decisions directly to ad copies.",
                "Real-time Startup Readiness Score grading completed checkpoints.",
                "pgvector grounding parsing documents to train co-founder assistants."
              ].map((benefit, i) => (
                <div key={i} className="flex gap-2.5 text-xs text-slate-300 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Visual Flow Diagram */}
          <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-6 block">Venture Creation Pipeline Flow</h4>
            
            <div className="flex flex-col gap-4 font-mono text-[10px]">
              {[
                { label: "1. Raw Startup Idea", detail: "college eco streetwear in India", border: "border-slate-800 text-slate-400" },
                { label: "2. Strategic Feasibility Report", detail: "SWOT, risk analyses, differentiation", border: "border-emerald-900/50 text-emerald-400 bg-emerald-950/20" },
                { label: "3. Brand Identity Studio", detail: "matching palette, slogans, tone", border: "border-indigo-900/50 text-indigo-400 bg-indigo-950/20" },
                { label: "4. Financial & Projections Engine", detail: "monthly break-evens, setup costs", border: "border-amber-900/50 text-amber-400 bg-amber-950/20" },
                { label: "5. Launch Deployment", detail: "deploy Next.js landing page", border: "border-slate-850 text-white bg-slate-900/50" },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`flex-1 p-3 border rounded-xl flex items-center justify-between ${step.border}`}>
                    <span className="font-bold">{step.label}</span>
                    <span className="text-[9px] opacity-70 italic">{step.detail}</span>
                  </div>
                  {idx < 4 && (
                    <div className="hidden sm:block text-slate-700 font-sans text-xs">↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase 12-Card Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[10px] text-slate-455 uppercase font-bold tracking-wider">Features Suite</span>
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
            Sophisticated modules to validate, structure and scale.
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Everything your venture needs, managed from a single unified, secure dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Startup Validation", desc: "Evaluate idea feasibility, profitability potential, and swot threats.", icon: Shield },
            { title: "Competitor Research", desc: "Log competitor websites, strengths, pricing models, and differentials.", icon: Search },
            { title: "Branding Studio", desc: "Select color hex grids, naming slogans, brand voices, and asset prompts.", icon: Palette },
            { title: "Marketing Engine", desc: "Generate social calendars, ad copy, and client welcoming sequences.", icon: Megaphone },
            { title: "Financial Forecasting", desc: "Map projections cash flows, monthly overheads, and break-even points.", icon: IndianRupee },
            { title: "Pitch Deck Generator", desc: "Formulate market sizes (TAM/SAM/SOM), slides content, and models.", icon: Presentation },
            { title: "Landing Page Builder", desc: "Build Next.js code structures for startup websites ready to deploy.", icon: Globe },
            { title: "Knowledge Base", icon: BookOpen, desc: "Ingest and index surveys, PDFs, and local context files for RAG search." },
            { title: "AI Memory", icon: History, desc: "Persistent memory caching previous iterations to enrich strategy advices." },
            { title: "Semantic Search", icon: Sliders, desc: "Locate matching insights across indexed workspace records instantly." },
            { title: "Team Collaboration", icon: Users, desc: "Manage members roles list, comment on assets, and review logs." },
            { title: "Venture Health OS", icon: Activity, desc: "Calculate startup readiness score matching 5 validation weights." },
          ].map((feat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-48 hover:border-slate-350 transition-all hover:shadow-md">
              <div className="space-y-2">
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl w-fit">
                  <feat.icon className="w-4 h-4 text-slate-700" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 mt-2">{feat.title}</h3>
                <p className="text-[11px] text-slate-550 leading-relaxed">{feat.desc}</p>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mt-2">Active Module</span>
            </div>
          ))}
        </div>
      </section>

      {/* Signature Feature Spotlight: Startup Readiness Score */}
      <section className="bg-slate-50 border-y border-slate-200 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* Visual Showcase: Readiness Score Circular Gauge with details */}
          <div className="flex-1 w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-md flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-6">Readiness Health System mockup</span>
            
            <div className="relative w-36 h-36 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#F8FAFC" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#spotlight-grad)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * 85) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="spotlight-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-805">85%</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Readiness</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              {[
                { label: 'Market Validation', val: 100, color: 'bg-emerald-500' },
                { label: 'Brand Identity Studio', val: 80, color: 'bg-indigo-500' },
                { label: 'Marketing Strategy Plan', val: 60, color: 'bg-amber-500' },
                { label: 'Financial Projections Model', val: 80, color: 'bg-emerald-600' },
                { label: 'Knowledge Base Ingestions', val: 75, color: 'bg-blue-500' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-700">
                    <span>{item.label}</span>
                    <span className="font-bold">{item.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <span className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider">Centerpiece Feature</span>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
              The Startup Readiness Score
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Unlike generic templates, StartupOS AI automatically aggregates completed checklists across 5 planning segments to generate a single composite launch rating (0-100%).
            </p>
            <p className="text-slate-550 text-xs sm:text-sm leading-relaxed">
              As you configure branding assets, refine financial models, or upload knowledge documents, your index updates in real time, triggering actionable strategists recommendations to improve beta feasibility.
            </p>
            <div className="pt-4 border-t border-slate-200">
              <Link 
                href="/signup" 
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Track Your Venture Score
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RAG & Vector Memory visualization section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider font-mono">AI Infrastructure</span>
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
            Context-grounded Startup Intelligence Layer
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            StartupOS AI maintains persistent context so future workspace generations reference previous branding and cost decisions.
          </p>
        </div>

        <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><History className="w-5 h-5 text-indigo-400" /> Persistent RAG Pipeline</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              When you upload files, our background system parses PDF contents, chunks text, and calls Google text-embedding pipelines to cache high-dimensional vector representations.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Future prompts query similarity matches via cosine distance vector matches, supplying granular context so workspace co-founder agents deliver accurate SWOT lists or expense projections.
            </p>
          </div>

          {/* RAG SVG flowchart */}
          <div className="flex-1 w-full bg-slate-950 border border-slate-850 p-6 rounded-2xl">
            <h4 className="text-[8px] uppercase tracking-wider font-bold text-slate-500 mb-6 font-mono">Semantic RAG Architecture Flow</h4>
            <div className="grid grid-cols-1 gap-3 text-center text-[9px] font-mono">
              <div className="p-2 border border-slate-800 bg-slate-900 rounded-lg text-slate-350">
                Proprietary Documents Upload (.pdf, .txt)
              </div>
              <div className="text-slate-700">↓</div>
              <div className="p-2 border border-violet-900/50 bg-violet-950/20 text-violet-400 rounded-lg">
                Text Extraction & Chunking (800 char window, 100 overlap)
              </div>
              <div className="text-slate-705 text-slate-700">↓</div>
              <div className="p-2 border border-indigo-900/50 bg-indigo-950/20 text-indigo-400 rounded-lg">
                Gemini text-embedding-004 vector mapping
              </div>
              <div className="text-slate-700">↓</div>
              <div className="p-2 border border-emerald-900/50 bg-emerald-950/20 text-emerald-450 rounded-lg">
                Indexed in pgvector memory storage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team OS & Collaboration Section */}
      <section className="bg-slate-50 border-t border-slate-200 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* Left Side: SVG layout showing version rollbacks, comments and audit trails */}
          <div className="flex-1 w-full bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Audit Trail Log History mockup</span>
            
            <div className="space-y-3 font-mono text-[9px]">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800">Version #2 Snapshot checkpointed</span>
                  <span className="text-slate-400">Branding assets: Brand voice refinement</span>
                </div>
                <span className="text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[8px] font-bold uppercase shrink-0">Restore</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800">Comment posted on Projections</span>
                  <span className="text-slate-400">Du rep: &quot;Double-check Year 1 TAM overheads&quot;</span>
                </div>
                <span className="text-slate-400 text-[8px] uppercase shrink-0">Resolved</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800">Document Uploaded and indexed</span>
                  <span className="text-slate-400">Founder: &quot;Chennai textile supplier directory.txt&quot;</span>
                </div>
                <span className="text-emerald-600 text-[8px] font-bold uppercase shrink-0">RAG active</span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <span className="text-[10px] text-violet-600 uppercase font-bold tracking-wider">Multi-User Console</span>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
              Production-grade Team OS
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              StartupOS AI is built for professional co-founders, advisors, and investment analysts, not just single users.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-800">Workspace Roles</h4>
                <p className="text-[10px] text-slate-550">Assign Owner, Admin, Editor or Viewer memberships hierarchy.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-800">Version Snapshot History</h4>
                <p className="text-[10px] text-slate-550">Save planning checkpoints and restore modules to previous version snapshots.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-800">Inline asset commenting</h4>
                <p className="text-[10px] text-slate-550">Post resource notes and feedback on generated outputs directly.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-800">Timeline Auditing</h4>
                <p className="text-[10px] text-slate-550">Full event trails logging generations, uploads, invitations and updates.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Screenshots Slider Carousel */}
      <section id="screenshots" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Interactive Gallery</span>
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
            Explore the Workspace Console
          </h2>
          <p className="text-slate-550 text-xs sm:text-sm">
            Toggle between console interfaces to inspect visual layouts and technical workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Navigation selectors */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2.5 overflow-x-auto pb-4 lg:pb-0 shrink-0">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-full text-left px-5 py-4 rounded-2xl border transition-all shrink-0 sm:shrink-1 flex flex-col ${
                  activeSlide === idx 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'
                }`}
              >
                <span className="text-[9px] uppercase font-bold opacity-60 block">{slide.category}</span>
                <span className="font-bold text-xs mt-1 block">{slide.title}</span>
              </button>
            ))}
          </div>

          {/* Screenshot Display Box */}
          <div className="lg:col-span-8 bg-slate-50 border border-slate-200 p-4 sm:p-6 rounded-3xl shadow-inner min-h-[380px] flex items-center justify-center relative">
            <div className="w-full h-full aspect-[4/3] max-w-lg transition-all duration-300">
              {slides[activeSlide].element}
            </div>
            {/* Slide Details overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-200/50 p-3 rounded-xl shadow-sm text-center">
              <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">{slides[activeSlide].description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Architecture Showcase Section */}
      <section id="architecture" className="bg-slate-900 text-slate-100 border-y border-slate-800 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider font-mono">Infrastructure diagram</span>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight leading-tight">
              Production-Grade Architecture
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              StartupOS AI is engineered on high-performance serverless infrastructures built for scale, vector performance, and security.
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-white block">Next.js & TypeScript</span>
                <p className="text-[10px] text-slate-500">React 19, TypeScript compiler checks, server actions validation loops.</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-white block">Supabase & PostgreSQL</span>
                <p className="text-[10px] text-slate-500">Row-level security policies (RLS), triggers, schemas cascading.</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-white block">Gemini AI Models</span>
                <p className="text-[10px] text-slate-500">Gemini-1.5-flash for speed, text-embedding-004 for high-dim memory.</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-white block">pgvector & RAG</span>
                <p className="text-[10px] text-slate-500">Cosine similarity vector distance search for persistent memory.</p>
              </div>
            </div>
          </div>

          {/* SVG Tech Map */}
          <div className="flex-1 w-full bg-slate-950 border border-slate-850 p-6 sm:p-8 rounded-3xl text-center relative overflow-hidden flex flex-col items-center">
            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500 mb-8 block font-mono">System Infrastructure Mapping</span>
            
            <div className="w-full space-y-6 font-mono text-[9px]">
              {/* Frontend Node */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl w-48 mx-auto flex items-center justify-center gap-2">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Next.js App (Client/Server)</span>
              </div>
              
              <div className="text-slate-800 text-xs">↓ ↑</div>
              
              {/* Database & Middleware Node */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-center gap-2">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase / PostgreSQL</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-center gap-2">
                  <Server className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Upstash QStash queues</span>
                </div>
              </div>

              <div className="text-slate-800 text-xs">↓ ↑</div>

              {/* RAG Memory & AI layers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-violet-400" />
                  <span>Gemini LLM / Embedding</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-center gap-2">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>pgvector memory database</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Development Journey Timeline */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Project Timeline</span>
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
            Development Roadmaps
          </h2>
          <p className="text-slate-550 text-xs sm:text-sm">
            Recruiter and VC portfolio checklist tracing project evolution.
          </p>
        </div>

        <div className="relative pl-6 border-l border-slate-200 max-w-3xl mx-auto space-y-10">
          {[
            { phase: "Phase 1", title: "Core Startup Workflows", desc: "Orchestrated market feasibility research SWOT pipelines, branding styling palette selectors, P&L budgets forecasts, and pdf pitch decks schemas." },
            { phase: "Phase 2", title: "AI Memory & RAG Base", desc: "Added pgvector embedding maps, similarity cosine queries, automatic grounding contexts, and document chunking upload pipelines." },
            { phase: "Phase 3", title: "Team Collaboration OS", desc: "Configured roles memberships hierarchy, audit timeline events, comment thread posts, versions checkpoints, and databases schema rollbacks." },
            { phase: "Phase 4", title: "Usage limits & Health Dashboard", desc: "Integrated subscriptions tiers, document storage calculations, welcome templates, and signature Startup Readiness Score gauges." },
            { phase: "Phase 5", title: "Beta Showcase Page", desc: "Assembled this portfolio product showcase, compiled bundler builds, and ran linting typecheck validation routines." },
          ].map((step, idx) => (
            <div key={idx} className="relative space-y-1">
              <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 bg-white" />
              <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{step.phase}</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">{step.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Highlights Section */}
      <section className="bg-slate-50 border-t border-slate-200 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Engineering Highlights</span>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight leading-tight">
              Built for Production Scale
            </h2>
            <p className="text-slate-550 text-xs sm:text-sm">
              Advanced engineering paradigms mapping security, rate limiting, and observability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Multi-Agent Systems", desc: "Gemini-1.5-flash prompts orchestrate research, finance, and marketing steps." },
              { title: "pgvector Indexing", desc: "Cosine similarity queries grounding prompt contexts in historical data." },
              { title: "Row-Level Security (RLS)", desc: "Cascading PostgreSQL RLS constraints securing multi-tenant databases." },
              { title: "Upstash Redis Limits", desc: "Configured sliding window rate-limit checks to prevent LLM service overloads." },
              { title: "Lightweight Resend", desc: "Lightweight, decoupled email service dispatcher mapping domain headers." },
              { title: "Billing Limits", desc: "Enforces usage tiers boundaries checking databases totals dynamically." },
              { title: "Tailwind Styling", desc: "Modern CSS visual guidelines matching Stripe and Linear aesthetic structures." },
              { title: "High Lighthouse Metrics", desc: "Optimized script footprints, responsive sizing, and clean compile builds." },
            ].map((high, i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-2 hover:border-slate-350 transition-colors">
                <div className="p-1 bg-emerald-50 border border-emerald-100 rounded text-emerald-600 font-bold text-[8px] w-5 h-5 flex items-center justify-center">✓</div>
                <h4 className="font-bold text-xs text-slate-900 mt-2">{high.title}</h4>
                <p className="text-[10px] text-slate-500 leading-normal">{high.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <div className="space-y-6">
          <h2 className="text-3xl sm:text-5xl font-sans font-bold text-slate-900 tracking-tight">
            Launch Your AI Co-Founded Startup Today
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Configure your workspace co-founders console, upload context documents, and run feasibility checks in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-md"
            >
              Start Building Free
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all shadow-sm"
            >
              Sign In to Console
            </Link>
          </div>
        </div>
      </section>

      {/* Founder Attribution Section */}
      <section className="bg-white border-t border-slate-200 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Bio, Links, Metrics */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] text-slate-450 uppercase font-bold tracking-widest block font-mono">Project Creator</span>
              <h2 className="text-3xl font-sans font-bold text-slate-900 tracking-tight">
                Built By Raghav Baijal
              </h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Founder &bull; Full Stack Developer &bull; AI Enthusiast
              </p>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
              StartupOS AI was designed and developed by Raghav Baijal, a Computer Science student and full stack developer focused on building AI-powered software products. The platform combines startup planning, knowledge intelligence, team collaboration, and modern SaaS architecture into a unified founder operating system.
            </p>

            {/* Metrics Panel */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-6 rounded-2xl">
              {FOUNDER_METRICS.map((metric, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-xl font-bold text-slate-900 block tracking-tight font-mono">{metric.count}</span>
                  <span className="text-[10px] text-slate-550 font-semibold uppercase">{metric.label}</span>
                </div>
              ))}
            </div>

            {/* Social / Portfolio Links */}
            <div className="flex flex-wrap gap-3">
              <a 
                href={GITHUB_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-750 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
              <a 
                href={LINKEDIN_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-750 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                LinkedIn
              </a>
              <a 
                href={PORTFOLIO_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-750 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                Portfolio
              </a>
              <a 
                href={`mailto:${EMAIL_ADDRESS}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-750 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Email
              </a>
            </div>
          </div>

          {/* Right Column: Tech tags, Engineering Concepts */}
          <div className="lg:col-span-7 space-y-8">
            {/* Tech Highlights */}
            <div className="space-y-4">
              <span className="text-[10px] text-slate-450 uppercase font-bold tracking-widest block font-mono">Technology Stack</span>
              <div className="space-y-3">
                {[
                  { category: "Frontend", techs: ["Next.js", "TypeScript", "Tailwind CSS"] },
                  { category: "Backend", techs: ["Supabase", "PostgreSQL"] },
                  { category: "AI Layer", techs: ["Gemini AI", "RAG", "Vector Search", "pgvector"] },
                  { category: "Infrastructure", techs: ["QStash Queues", "Resend Email", "Vercel"] },
                  { category: "Collaboration", techs: ["Team Workspaces", "Activity Logs", "Version History"] },
                ].map((stack, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                    <span className="w-28 font-bold text-slate-400 uppercase tracking-wider shrink-0 text-[10px]">{stack.category}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {stack.techs.map((tech, j) => (
                        <span key={j} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Engineering Concepts */}
            <div className="space-y-4">
              <span className="text-[10px] text-slate-450 uppercase font-bold tracking-widest block font-mono">Key Engineering Concepts</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Retrieval-Augmented Generation", desc: "Grounds co-founder context using high-dimensional text-embedding-004 vectors indexed in PostgreSQL." },
                  { title: "Semantic Vector Search", desc: "Calculates cosine distance calculations to locate relative insights across workspace data dynamically." },
                  { title: "Multi-Agent Workflows", desc: "Orchestrates complex business analysis across research, branding, marketing, and projections agents." },
                  { title: "Background Job Processing", desc: "Decouples long-running generation loops using robust queuing architectures." },
                  { title: "Row-Level Security (RLS)", desc: "Secures multi-tenant boundaries by enforcing strict data isolation parameters." },
                  { title: "SaaS Billing Limits", desc: "Implements strict plan boundaries by checking database usage tables dynamically." }
                ].map((concept, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                    <span className="text-xs font-bold text-slate-900 block">{concept.title}</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-normal">{concept.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recruiter Callout */}
            <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Interested in the architecture behind StartupOS AI?</span>
              </div>
              <p className="text-[10px] text-slate-405 text-slate-400 leading-normal">
                I designed StartupOS AI as a production-grade showcase demonstrating how modern serverless infrastructures handle multi-agent loops and vector databases. You can inspect the engineering files directly:
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-mono text-indigo-400">
                <a href="#architecture" className="hover:text-indigo-300 hover:underline">Product Overview &uarr;</a>
                <a href="#architecture" className="hover:text-indigo-300 hover:underline">Technical Architecture &uarr;</a>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 hover:underline">GitHub Repository &rarr;</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-800" />
              <span className="font-sans font-bold text-slate-950 text-sm">StartupOS AI</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              World-class SaaS operating system designed for modern co-founders and venture developers.
            </p>
          </div>

          {[
            {
              title: "Product suite",
              links: [
                { label: "Startup Validation", href: "/signup" },
                { label: "Branding Studio", href: "/signup" },
                { label: "Financial Engine", href: "/signup" },
                { label: "Team Collaboration", href: "/signup" },
              ]
            },
            {
              title: "Technologies",
              links: [
                { label: "Next.js & TypeScript", href: "#" },
                { label: "Supabase & pgvector", href: "#" },
                { label: "Google Gemini AI", href: "#" },
                { label: "Upstash & QStash", href: "#" },
              ]
            },
            {
              title: "Portfolio info",
              links: [
                { label: "Beta Testing Rules", href: "#" },
                { label: "Terms of Service", href: "#" },
                { label: "Privacy Policy", href: "#" },
                { label: "GitHub Codebase", href: "https://github.com" },
              ]
            }
          ].map((col, i) => (
            <div key={i} className="space-y-3">
              <h5 className="text-[9px] uppercase tracking-wider font-bold text-slate-400">{col.title}</h5>
              <ul className="space-y-2">
                {col.links.map((link, idx) => (
                  <li key={idx}>
                    <Link href={link.href} className="text-[11px] text-slate-500 hover:text-slate-900 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-450 gap-4">
          <span>&copy; {new Date().getFullYear()} StartupOS AI. All rights reserved. Built by Raghav Baijal.</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-slate-900">Privacy</Link>
            <Link href="#" className="hover:text-slate-900">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

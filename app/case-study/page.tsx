'use client';

import Link from 'next/link';
import { 
  ArrowLeft, Cpu, Database, Server, Mail, Lock, 
  Terminal, Shield, FileText, BarChart3, Layers, 
  Activity, BookOpen, RefreshCw, Zap
} from 'lucide-react';

export default function EngineeringCaseStudyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col selection:bg-indigo-100">
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
              <Terminal className="w-5 h-5 text-emerald-650" />
            </div>
            <span className="font-sans font-bold text-lg text-slate-900 tracking-tight">
              StartupOS <span className="text-slate-550">Engine</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-12">
        {/* Title Block */}
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
            <SparklesIcon className="w-3.5 h-3.5" />
            Developer Case Study
          </div>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold text-slate-900 tracking-tight leading-[1.1]">
            Engineering StartupOS AI: System Architecture & Technical Specifications
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-3xl leading-relaxed">
            An in-depth look at how we built a multi-agent startup operating system using Next.js 15, PostgreSQL pgvector RAG grounding, Upstash QStash job queues, Resend mail transactions, and Supabase RLS tier systems.
          </p>
        </div>

        {/* Section 1: System Architecture */}
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-500" />
            1. System Architecture
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
            StartupOS AI separates concern between Client rendering (Next.js server-rendered console dashboards), middleware API route orchestration, database models mapping, and asynchronous background worker queues. By implementing a micro-agent orchestration layout, AI specialized co-founders (market analysts, copywriters, CPAs) collaborate and write progress structures to the transactional layer.
          </p>

          {/* SVG Diagram: Architecture Flow */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center">
            <svg viewBox="0 0 800 420" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Clients */}
              <rect x="20" y="160" width="140" height="80" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="2"/>
              <text x="90" y="200" textAnchor="middle" fill="#1E293B" fontSize="12" fontWeight="bold">Next.js Client</text>
              <text x="90" y="218" textAnchor="middle" fill="#64748B" fontSize="10">Web Dashboard View</text>
              
              {/* Next.js API Middleware */}
              <rect x="240" y="160" width="160" height="80" rx="12" fill="white" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 4"/>
              <text x="320" y="200" textAnchor="middle" fill="#1E293B" fontSize="12" fontWeight="bold">API Router / Server Actions</text>
              <text x="320" y="218" textAnchor="middle" fill="#64748B" fontSize="10">Orchestrator Gateway</text>

              {/* Supabase DB Layer */}
              <rect x="520" y="80" width="160" height="80" rx="12" fill="white" stroke="#10B981" strokeWidth="2"/>
              <text x="600" y="120" textAnchor="middle" fill="#1E293B" fontSize="12" fontWeight="bold">Supabase (PostgreSQL)</text>
              <text x="600" y="138" textAnchor="middle" fill="#64748B" fontSize="10">RLS Policies & pgvector</text>

              {/* Background Worker */}
              <rect x="520" y="240" width="160" height="80" rx="12" fill="white" stroke="#F59E0B" strokeWidth="2"/>
              <text x="600" y="280" textAnchor="middle" fill="#1E293B" fontSize="12" fontWeight="bold">Upstash QStash Queue</text>
              <text x="600" y="298" textAnchor="middle" fill="#64748B" fontSize="10">Async Orchestrator Jobs</text>

              {/* Connections */}
              <path d="M160 200 H240" stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrow)"/>
              <path d="M400 180 Q460 180 460 120 T520 120" stroke="#6366F1" strokeWidth="2" markerEnd="url(#arrow)"/>
              <path d="M400 220 Q460 220 460 280 T520 280" stroke="#6366F1" strokeWidth="2" markerEnd="url(#arrow)"/>
              
              {/* Database to Worker */}
              <path d="M600 240 V160" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow)" markerStart="url(#circle)"/>

              {/* Markers */}
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8"/>
                </marker>
              </defs>
            </svg>
          </div>
        </section>

        {/* Section 2: pgvector RAG Pipeline */}
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            2. pgvector RAG Knowledge Pipeline
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
            To prevent hallucinations and ground co-founder queries in proprietary data, our Knowledge Assistant implements a Retrieve-and-Generate (RAG) vector model. Uploaded documents (PDFs, TXT files) are parsed, chunked into overlap blocks, embedded using Google&apos;s <code>text-embedding-004</code> API, and indexed into Supabase PostgreSQL&apos;s <code>public.documents</code> table. Real-time assistant queries utilize cosine similarity metrics (<code>&lt;=&gt;</code>) to matching context injection hooks.
          </p>

          {/* SVG Diagram: pgvector RAG */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center">
            <svg viewBox="0 0 800 240" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Document upload block */}
              <rect x="20" y="80" width="120" height="70" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="2"/>
              <text x="80" y="112" textAnchor="middle" fill="#1E293B" fontSize="11" fontWeight="bold">PDF / Text File</text>
              <text x="80" y="128" textAnchor="middle" fill="#64748B" fontSize="9">User Upload</text>

              {/* Embedding API */}
              <rect x="200" y="80" width="140" height="70" rx="10" fill="white" stroke="#6366F1" strokeWidth="2"/>
              <text x="270" y="112" textAnchor="middle" fill="#1E293B" fontSize="11" fontWeight="bold">text-embedding-004</text>
              <text x="270" y="128" textAnchor="middle" fill="#64748B" fontSize="9">Gemini Embeddings</text>

              {/* Vector database */}
              <rect x="400" y="80" width="150" height="70" rx="10" fill="white" stroke="#10B981" strokeWidth="2"/>
              <text x="475" y="112" textAnchor="middle" fill="#1E293B" fontSize="11" fontWeight="bold">pgvector Index</text>
              <text x="475" y="128" textAnchor="middle" fill="#64748B" fontSize="9">Cosine Similarity Match</text>

              {/* Gemini Flash LLM */}
              <rect x="610" y="80" width="160" height="70" rx="10" fill="white" stroke="#F59E0B" strokeWidth="2"/>
              <text x="690" y="112" textAnchor="middle" fill="#1E293B" fontSize="11" fontWeight="bold">gemini-1.5-flash</text>
              <text x="690" y="128" textAnchor="middle" fill="#64748B" fontSize="9">Grounded Co-founder Output</text>

              {/* Arrows */}
              <path d="M140 115 H200" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arrow)"/>
              <path d="M340 115 H400" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arrow)"/>
              <path d="M550 115 H610" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arrow)"/>
            </svg>
          </div>
        </section>

        {/* Section 3: Background queue processing */}
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-amber-500" />
            3. Asynchronous Background Workers & Job Queues
          </h2>
          <p className="text-slate-550 text-xs sm:text-sm leading-relaxed">
            Running multiple agent co-founders synchronously would cause server timeout errors. StartupOS AI decouples AI orchestrator tasks. Creating a startup validates, triggers QStash Webhooks, saves pending logs to <code>public.jobs</code>, and initiates a serverless execution queue. Clients poll the job status in real time, visualizing agent progress checks (SWOT quadrant research, branding layout color mappings, monthly spreadsheets calculations) as they complete transaction updates.
          </p>
        </section>

        {/* Section 4: Security & Row-Level Security (RLS) */}
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-indigo-500" />
            4. Enterprise Security & pg-RLS Policies
          </h2>
          <p className="text-slate-550 text-xs sm:text-sm leading-relaxed">
            Security is configured at the PostgreSQL core. Row-Level Security (RLS) restricts access to workspaces based on authenticated tenant membership rules. Users can only view documents, comments, financial plans, or brand models for workspaces where their email profile maps to active memberships. Supabase authentication hooks govern query evaluations automatically.
          </p>
          <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 font-mono text-[10px] sm:text-xs overflow-x-auto space-y-1 shadow-inner">
            <p className="text-slate-500">-- RLS Policy: Workspace Tenant Check</p>
            <p><span className="text-indigo-400">CREATE POLICY</span> tenant_access_policy <span className="text-indigo-400">ON</span> public.workspaces</p>
            <p>&nbsp;&nbsp;<span className="text-indigo-400">FOR ALL</span></p>
            <p>&nbsp;&nbsp;<span className="text-indigo-400">USING</span> (</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;auth.uid() = user_id <span className="text-indigo-400">OR</span></p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;EXISTS (</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-400">SELECT 1 FROM</span> public.workspace_members</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-400">WHERE</span> workspace_id = id <span className="text-indigo-400">AND</span> user_id = auth.uid()</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;)</p>
            <p>&nbsp;&nbsp;);</p>
          </div>
        </section>

        {/* Section 5: Billing & Limits */}
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-500" />
            5. Provider-Agnostic Billing & Usage Tracking
          </h2>
          <p className="text-slate-555 text-xs sm:text-sm leading-relaxed">
            StartupOS AI tracks plan metrics directly in the database, verifying user usage limits before spawning operations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-250 rounded-2xl">
              <p className="text-xs font-bold text-slate-800">Free Tier Guardrails</p>
              <ul className="text-[10px] text-slate-550 list-disc pl-4 mt-2 space-y-1">
                <li>10 AI generations limit per month</li>
                <li>1 Active workspace max</li>
                <li>1 Indexed vector document upload</li>
              </ul>
            </div>
            <div className="p-4 bg-white border border-slate-250 rounded-2xl">
              <p className="text-xs font-bold text-slate-800">Pro & Team Subscription limits</p>
              <ul className="text-[10px] text-slate-550 list-disc pl-4 mt-2 space-y-1">
                <li>Unlimited Workspace agents runs</li>
                <li>Unlimited document uploads</li>
                <li>Advanced collaborative role control features</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Sparkles inline component helper
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
    </svg>
  );
}

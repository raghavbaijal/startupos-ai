import { createClient } from '@/lib/db/server';
import { redirect } from 'next/navigation';
import { createWorkspace } from '@/app/workspace-actions';
import { Shield, ArrowLeft, Loader2, Sparkles, Send } from 'lucide-react';
import Link from 'next/link';

export default async function NewWorkspacePage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  let user = null;

  if (isDemoMode) {
    user = { id: 'mock-user-id', email: 'demo-founder@startupos.ai' };
  } else {
    const supabase = await createClient();
    const {
      data: { user: dbUser },
    } = await supabase.auth.getUser();
    user = dbUser;

    if (!user) {
      redirect('/login');
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
            <span className="font-semibold text-slate-600 text-sm">Back to Dashboard</span>
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

      {/* Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-2xl glass-panel border border-slate-200 p-8 sm:p-10 rounded-3xl relative shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Sparkles className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Launchpad</span>
          </div>

          <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-tight">
            Create New Workspace
          </h1>
          <p className="text-slate-500 text-sm mt-1 mb-8">
            Tell the AI co-founder about your startup idea. We&apos;ll use this context to generate your business models, research reports, visual assets, and financials.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-650">
              {error}
            </div>
          )}

          <form action={createWorkspace} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Startup Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. EcoThread India"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <label htmlFor="industry" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Industry / Sector
                </label>
                <input
                  id="industry"
                  name="industry"
                  type="text"
                  required
                  placeholder="e.g. Sustainable Fashion / E-commerce"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Budget */}
              <div className="space-y-2">
                <label htmlFor="budget" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Starting Budget (INR)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm">₹</span>
                  </div>
                  <input
                    id="budget"
                    name="budget"
                    type="text"
                    required
                    placeholder="e.g. 50,000"
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Stage */}
              <div className="space-y-2">
                <label htmlFor="stage" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Current Startup Stage
                </label>
                <select
                  id="stage"
                  name="stage"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                >
                  <option value="ideation">Ideation / Raw Concept</option>
                  <option value="validation">Market Validation</option>
                  <option value="branding">Branding & Identity</option>
                  <option value="mvp">MVP Development</option>
                  <option value="growth">Scaling & Growth</option>
                </select>
              </div>
            </div>

            {/* Target Market */}
            <div className="space-y-2">
              <label htmlFor="targetMarket" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Target Market / Audience
              </label>
              <input
                id="targetMarket"
                name="targetMarket"
                type="text"
                required
                placeholder="e.g. College students in India, age 18-24, eco-conscious buyers"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Startup Description / Idea details
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="Describe your startup concept, key products/services, how it works, and what problem it solves..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-4">
              <Link
                href="/"
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-all active:scale-[0.98]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-all shadow-sm active:scale-[0.98]"
              >
                Create Workspace
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

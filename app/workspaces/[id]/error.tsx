'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw, LayoutDashboard, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Workspace-level Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center px-6 py-12">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
              Workspace Load Interrupted
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              We couldn&apos;t load the workspace content. This typically happens due to network disruptions, session expiration, or database connection limits.
            </p>
          </div>
        </div>

        {error.message && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block mb-1">
              Diagnostics
            </span>
            <code className="text-xs text-red-600 block break-all font-mono">
              {error.message}
            </code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Connection
          </button>
          
          <Link
            href="/"
            className="flex-1 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-450">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Need assistance?
          </span>
          <a
            href="mailto:support@startupos.ai"
            className="text-emerald-600 font-semibold hover:underline"
          >
            Contact System Support
          </a>
        </div>
      </div>
    </div>
  );
}

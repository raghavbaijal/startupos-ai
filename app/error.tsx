'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center px-6 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
          <AlertTriangle className="w-8 h-8 text-red-600 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
            Application Exception
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            StartupOS encountered an unexpected exception. We have captured the diagnostics and our engineering team has been notified.
          </p>
        </div>

        {error.message && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block mb-1">
              Error Details
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
            Try Again
          </button>
          
          <Link
            href="/"
            className="flex-1 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

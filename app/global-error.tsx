'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Layout Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
            <ShieldAlert className="w-8 h-8 text-red-600 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              System Initialization Error
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              We encountered a critical error during initialization. Please retry or refresh the page to establish a new connection session.
            </p>
          </div>

          {error.message && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block mb-1">
                Details
              </span>
              <code className="text-xs text-red-600 block break-all font-mono">
                {error.message}
              </code>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="w-full px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              Reinitialize System
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

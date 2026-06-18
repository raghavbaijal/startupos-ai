'use client';

import { 
  X, Zap, Shield, CheckCircle2, Layers, 
  ArrowRight, Sparkles 
} from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  limitType?: 'workspace' | 'document' | 'generation' | 'collaboration' | 'general';
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  title = "Upgrade to continue", 
  message = "You have reached your Free tier usage limits. Upgrade to Pro or Team to continue building.",
  limitType = "general"
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const featuresList = [
    { title: "Unlimited Workspaces", desc: "Build, configure, and manage as many co-founded startups as you need." },
    { title: "500+ AI Generations / Month", desc: "Run SWOT evaluations, financial break-even charts, and content strategies instantly." },
    { title: "Persistent RAG Memory Base", desc: "Upload and index documents to ground your co-founder chats in your business context." },
    { title: "Team Collaboration & Comments", desc: "Invite co-founders and advisors with roles, snapshots rollbacks, and comment boards." }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg mx-4 bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative z-10 overflow-hidden flex flex-col justify-between max-h-[90vh]">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-full blur-[60px] pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex p-3 bg-indigo-50 border border-indigo-150 text-indigo-650 rounded-2xl">
              <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              {message}
            </p>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Benefits Grid */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Unlock Pro & Team Plan benefits:</h4>
            <div className="space-y-3">
              {featuresList.map((feat, idx) => (
                <div key={idx} className="flex gap-3 items-start text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">{feat.title}</span>
                    <span className="text-slate-500 font-normal leading-normal">{feat.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Pricing Summary */}
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-slate-800">Pro Subscription</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Flexible monthly plans. Cancel anytime.</p>
            </div>
            <span className="text-sm font-extrabold text-slate-905">$29 / mo</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-all text-center"
          >
            Stay on Free Plan
          </button>
          
          <Link
            href="/settings/billing"
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-md text-center flex items-center justify-center gap-1.5"
          >
            Upgrade Now
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

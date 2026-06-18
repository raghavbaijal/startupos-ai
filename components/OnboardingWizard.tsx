'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight, Shield, Rocket, HelpCircle, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { createWorkspaceOnboarding } from '@/app/workspace-actions';

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    budget: '50,000',
    stage: 'validation',
    targetMarket: '',
    description: '',
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handlePrev = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('industry', formData.industry);
      data.append('budget', formData.budget);
      data.append('stage', formData.stage);
      data.append('targetMarket', formData.targetMarket);
      data.append('description', formData.description);

      await createWorkspaceOnboarding(data);
    } catch (err) {
      console.error('Failed to create workspace:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl relative shadow-sm transition-all duration-300">
      {/* Step Indicators */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                step === s
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-4 ring-slate-100'
                  : step > s
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-650'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s === 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="inline-flex p-3.5 bg-violet-50 border border-violet-100 text-violet-600 rounded-2xl mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-sans font-bold text-slate-900 tracking-tight">
              Welcome to StartupOS <span className="text-slate-500 font-medium">AI</span>
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your intelligent startup operating system with long-term memory and specialized AI co-founders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {[
              {
                icon: Shield,
                title: 'Multi-Agent Co-founders',
                desc: 'Specialist agents in validation, finance, and branding collaborate on your startup.',
              },
              {
                icon: Rocket,
                title: 'Market Validation Testing',
                desc: 'Run SWOT analyses, competitive matrices, and market feasibility checks instantly.',
              },
              {
                icon: HelpCircle,
                title: 'Persistent Memory & RAG',
                desc: 'Upload files and train the co-founder assistant directly on your proprietary context.',
              },
              {
                icon: Layers,
                title: 'Subscription Limits',
                desc: 'Free plan starts with 1 active workspace, 1 document ingest, and 10 AI generations monthly.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2 hover:border-slate-200 transition-colors">
                <div className="p-1.5 bg-white border border-slate-200 rounded-lg w-fit">
                  <feature.icon className="w-4 h-4 text-slate-700" />
                </div>
                <h4 className="font-bold text-xs text-slate-800">{feature.title}</h4>
                <p className="text-[11px] text-slate-500 leading-normal">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-[0.98]"
            >
              Configure Startup details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-sans font-bold text-slate-900">Define Startup Details</h2>
            <p className="text-slate-500 text-xs mt-1">
              Provide context so the AI co-founder can validate and customize your business model.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Startup Name
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. EcoThread India"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="industry" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Industry / Sector
              </label>
              <input
                id="industry"
                type="text"
                required
                placeholder="e.g. Sustainable Fashion / E-commerce"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="budget" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Starting Budget (INR)
              </label>
              <input
                id="budget"
                type="text"
                required
                placeholder="e.g. 50,000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="stage" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Current Startup Stage
              </label>
              <select
                id="stage"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
              >
                <option value="ideation">Ideation / Raw Concept</option>
                <option value="validation">Market Validation</option>
                <option value="branding">Branding & Identity</option>
                <option value="mvp">MVP Development</option>
                <option value="growth">Scaling & Growth</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="targetMarket" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Target Market / Audience
            </label>
            <input
              id="targetMarket"
              type="text"
              required
              placeholder="e.g. College students in India, age 18-24, eco-conscious buyers"
              value={formData.targetMarket}
              onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Startup Description / Idea details
            </label>
            <textarea
              id="description"
              required
              rows={3}
              placeholder="Describe your startup concept, key products, and the problem it solves..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm resize-none"
            />
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isLoading}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Back
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Creating Workspace...' : 'Launch Venture OS'}
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { generateStartupIdeas, GeneratedIdea } from '@/app/generator-actions';
import { adoptGeneratedIdea } from '@/app/workspace-actions';
import { 
  Sparkles, Brain, Check, RefreshCw, ArrowLeft, Send, 
  TrendingUp, Gauge, Shield, Layers, HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function StartupGeneratorPage() {
  const [isPending, startTransition] = useTransition();
  const [interests, setInterests] = useState('');
  const [budget, setBudget] = useState('');
  const [skills, setSkills] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [ideas, setIdeas] = useState<GeneratedIdea[] | null>(null);
  const [error, setError] = useState('');
  const [isAdopting, setIsAdopting] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interests || !budget || !skills || !targetMarket) {
      setError('All fields are required.');
      return;
    }
    setError('');
    
    startTransition(async () => {
      try {
        const res = await generateStartupIdeas(interests, budget, skills, targetMarket);
        if (res.success && res.data) {
          setIdeas(res.data);
        } else {
          setError(res.error || 'Generation failed.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      }
    });
  };

  const handleAdopt = async (idea: GeneratedIdea) => {
    setIsAdopting(idea.name);
    try {
      await adoptGeneratedIdea(
        JSON.stringify(idea),
        budget,
        skills,
        targetMarket
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Adoption failed.');
      setIsAdopting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative overflow-hidden text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-slate-350 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
            </div>
            <span className="font-semibold text-slate-600 text-xs transition-colors group-hover:text-slate-900">
              Dashboard Home
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
              <Shield className="w-5 h-5 text-slate-800" />
            </div>
            <span className="font-sans font-bold text-lg text-slate-900 tracking-tight">
              StartupOS <span className="text-slate-500">AI</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Generator Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Title */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-sans font-bold text-slate-900 tracking-tight">
            AI Startup Generator
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Input your parameters, constraints, and competencies. Let our AI agents compile and test viable startup concepts.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Loading Transition Screen */}
        {isPending ? (
          <div className="glass-panel border border-slate-200 bg-white p-12 text-center max-w-2xl mx-auto mt-6 shadow-sm rounded-3xl">
            <div className="inline-flex p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 shadow-inner animate-spin">
              <Brain className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-sans font-bold text-slate-900">Brainstorming Concepts...</h3>
            <p className="text-slate-500 text-xs mt-3 max-w-md mx-auto leading-relaxed">
              Our AI Architect is analyzing market sizing, matching your budget constraint, evaluating operational risk metrics, and drafting recommended launch paths.
            </p>
          </div>
        ) : !ideas ? (
          /* Form Input Card */
          <div className="w-full max-w-3xl glass-panel border border-slate-200 bg-white p-8 sm:p-10 rounded-3xl mx-auto shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Interests */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    My Core Interests
                  </label>
                  <input
                    type="text"
                    required
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g. coffee, sustainable tech, pet care"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                  />
                </div>

                {/* Budget */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Starting Budget (INR)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 50,000"
                      className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  My Core Competencies / Skills
                </label>
                <input
                  type="text"
                  required
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. writing, graphic design, basic coding, networking"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                />
              </div>

              {/* Target Market */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Target Customer / Demographic
                </label>
                <input
                  type="text"
                  required
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="e.g. college students in Bangalore, pet owners, small businesses"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-7 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-all shadow-sm active:scale-[0.98]"
                >
                  Generate Startup Ideas
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Results Section */
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                Tailored startup opportunities generated
              </span>
              <button
                onClick={() => setIdeas(null)}
                className="text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-all shadow-sm"
              >
                Reset Parameters
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {ideas.map((idea, idx) => {
                const isCurrentAdopting = isAdopting === idea.name;
                return (
                  <div 
                    key={idx} 
                    className="glass-panel border border-slate-200 bg-white hover:border-slate-350 p-6 sm:p-8 rounded-3xl flex flex-col justify-between relative group hover:shadow-md transition-all"
                  >
                    <div>
                      <span className="inline-flex px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 uppercase mb-3">
                        {idea.industry}
                      </span>
                      <h3 className="text-xl font-sans font-bold text-slate-900 transition-colors">{idea.name}</h3>
                      <p className="text-xs text-emerald-700 font-semibold italic mt-0.5 mb-3">&quot;{idea.tagline}&quot;</p>
                      
                      <p className="text-slate-500 text-xs leading-relaxed mb-6">{idea.description}</p>
                      
                      {/* Dials for metrics */}
                      <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 mb-6">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profitability</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-sm font-bold text-slate-700">{idea.profitability_score}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complexity</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Gauge className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-sm font-bold text-slate-700">{idea.difficulty_score}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Fit justification */}
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-6">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-600" />
                          Founder Match Fit
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed mt-1.5 font-medium">{idea.fit_justification}</p>
                      </div>

                      {/* Milestones execution path */}
                      <div className="mb-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recommended Execution Path</span>
                        <ul className="mt-2.5 space-y-2">
                          {idea.execution_path?.map((step, sIdx) => (
                            <li key={sIdx} className="text-slate-600 text-xs leading-normal flex gap-2">
                              <span className="w-4 h-4 rounded-full bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdopt(idea)}
                      disabled={isAdopting !== null}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
                    >
                      {isCurrentAdopting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Initializing OS...
                        </>
                      ) : (
                        <>
                          Adopt Idea & Open OS
                          <Send className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

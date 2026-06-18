'use client';

import { useState, useEffect } from 'react';
import { generateStartupOS, cleanupStaleJobs } from '@/app/generator-actions';
import { Sparkles, Brain, Check, RefreshCw, AlertTriangle, Play, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/db/client';

interface AIOSLauncherProps {
  workspaceId: string;
  workspaceName: string;
}

type AgentStep = {
  id: string;
  name: string;
  desc: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
};

export default function AIOSLauncher({ workspaceId, workspaceName }: AIOSLauncherProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([
    { id: 'research', name: 'Market Research Agent', desc: 'Analyzing market feasibility, gaps, and competition', status: 'pending' },
    { id: 'branding', name: 'Branding Studio Agent', desc: 'Generating brand names, slogans, color palettes, and logo prompts', status: 'pending' },
    { id: 'finance', name: 'Financial Engine Agent', desc: 'Estimating startup costs, monthly overheads, and break-even units', status: 'pending' },
    { id: 'strategy', name: 'Strategy Planner Agent', desc: 'Developing 30-day and 90-day launch milestones', status: 'pending' },
    { id: 'marketing', name: 'Marketing Copywriter Agent', desc: 'Creating email sequences, ad copy, and social media calendar', status: 'pending' },
  ]);

  // On mount: clean up stale jobs and check for active jobs to restore state
  useEffect(() => {
    let isMounted = true;

    const restoreActiveJob = async () => {
      try {
        // Clean up stale jobs first (updated_at > 15 minutes)
        await cleanupStaleJobs(workspaceId);

        // Check for active pending or processing job
        const supabase = createClient();
        const { data: job, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('workspace_id', workspaceId)
          .in('status', ['pending', 'processing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('[AIOSLauncher mount] Error checking active jobs:', error.message);
          return;
        }

        if (job && isMounted) {
          console.log('[AIOSLauncher mount] Restoring active job:', job.id);
          setJobId(job.id);
          setStatus('generating');
          if (job.step_status) {
            setSteps([
              { id: 'research', name: 'Market Research Agent', desc: 'Analyzing market feasibility, gaps, and competition', status: job.step_status.research || 'pending' },
              { id: 'branding', name: 'Branding Studio Agent', desc: 'Generating brand names, slogans, color palettes, and logo prompts', status: job.step_status.branding || 'pending' },
              { id: 'finance', name: 'Financial Engine Agent', desc: 'Estimating startup costs, monthly overheads, and break-even units', status: job.step_status.finance || 'pending' },
              { id: 'strategy', name: 'Strategy Planner Agent', desc: 'Developing 30-day and 90-day launch milestones', status: job.step_status.strategy || 'pending' },
              { id: 'marketing', name: 'Marketing Copywriter Agent', desc: 'Creating email sequences, ad copy, and social media calendar', status: job.step_status.marketing || 'pending' },
            ]);
          }
        }
      } catch (err: any) {
        console.error('[AIOSLauncher mount] Exception during active job recovery:', err.message || err);
      }
    };

    restoreActiveJob();

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  // Poll database or simulate progress depending on whether we have a jobId
  useEffect(() => {
    if (status !== 'generating') return;

    if (!jobId) {
      // Simulate progress across stages if we don't have a jobId (Demo Mode / Offline Fallback)
      let currentStepIdx = 0;
      const interval = setInterval(() => {
        setSteps((prevSteps) => {
          return prevSteps.map((step, idx) => {
            if (idx === currentStepIdx) {
              return { ...step, status: 'active' };
            } else if (idx < currentStepIdx) {
              return { ...step, status: 'completed' };
            }
            return step;
          });
        });

        if (currentStepIdx < steps.length) {
          currentStepIdx++;
        }
      }, 4500);

      return () => clearInterval(interval);
    }

    // Real database polling
    const supabase = createClient();
    let isMounted = true;

    const pollJobStatus = async () => {
      try {
        const { data: job, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('[AIOSLauncher] Error querying job:', error.message);
          return;
        }

        if (!job || !isMounted) return;

        // Map step_status fields to step visual states
        if (job.step_status) {
          setSteps([
            { id: 'research', name: 'Market Research Agent', desc: 'Analyzing market feasibility, gaps, and competition', status: job.step_status.research || 'pending' },
            { id: 'branding', name: 'Branding Studio Agent', desc: 'Generating brand names, slogans, color palettes, and logo prompts', status: job.step_status.branding || 'pending' },
            { id: 'finance', name: 'Financial Engine Agent', desc: 'Estimating startup costs, monthly overheads, and break-even units', status: job.step_status.finance || 'pending' },
            { id: 'strategy', name: 'Strategy Planner Agent', desc: 'Developing 30-day and 90-day launch milestones', status: job.step_status.strategy || 'pending' },
            { id: 'marketing', name: 'Marketing Copywriter Agent', desc: 'Creating email sequences, ad copy, and social media calendar', status: job.step_status.marketing || 'pending' },
          ]);
        }

        if (job.status === 'completed') {
          setStatus('success');
          setSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
          setTimeout(() => {
            router.refresh();
          }, 1500);
        } else if (job.status === 'failed') {
          setStatus('error');
          setErrorMsg(job.error_message || 'AI pipeline processing failed.');
          setSteps((prev) =>
            prev.map((s) => {
              if (s.status === 'active') {
                return { ...s, status: 'failed' };
              }
              return s;
            })
          );
        }
      } catch (err: any) {
        console.error('[AIOSLauncher] Failed to poll job:', err);
      }
    };

    // Run first poll immediately
    pollJobStatus();

    const interval = setInterval(pollJobStatus, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [status, jobId, router, steps.length]);

  const handleLaunch = async () => {
    setStatus('generating');
    setErrorMsg('');
    setJobId(null);
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'pending' })));

    try {
      const res = await generateStartupOS(workspaceId);

      if (res.success) {
        if (res.jobId) {
          setJobId(res.jobId);
        } else {
          // Demo mode completion
          setStatus('success');
          setSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
          setTimeout(() => {
            router.refresh();
          }, 1500);
        }
      } else {
        setStatus('error');
        setErrorMsg(res.error || 'Pipeline execution failed.');
        setSteps((prev) => prev.map((s) => (s.status === 'active' ? { ...s, status: 'failed' } : s)));
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="glass-panel border border-slate-200 p-8 sm:p-12 rounded-3xl relative overflow-hidden max-w-3xl mx-auto shadow-sm">
      {status === 'idle' && (
        <div className="text-center">
          <div className="inline-flex p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 shadow-inner animate-pulse">
            <Brain className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 tracking-tight">
            Initialize AI Co-founder OS
          </h2>
          <p className="text-slate-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
            Your workspace for <strong className="text-slate-800">&quot;{workspaceName}&quot;</strong> is ready. Trigger the multi-agent orchestration pipeline to generate feasibility research, SWOT metrics, branding palette configurations, 30/90 day roadmaps, and full copywriting plans.
          </p>

          <button
            onClick={handleLaunch}
            className="mt-8 inline-flex items-center gap-2.5 px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition-all shadow-sm active:scale-[0.98] group"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            Launch AI Agents Pipeline
          </button>
        </div>
      )}

      {status === 'generating' && (
        <div>
          <div className="flex items-center gap-3 mb-8">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Co-founder is thinking...</h3>
              <p className="text-slate-500 text-xs mt-0.5">Please wait, this will take about 20-30 seconds</p>
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex gap-4 p-4 rounded-xl border transition-all ${
                  step.status === 'active'
                    ? 'bg-slate-50 border-slate-300 shadow-sm'
                    : step.status === 'completed'
                    ? 'bg-slate-50/50 border-slate-200'
                    : 'bg-transparent border-slate-100'
                }`}
              >
                <div className="mt-0.5">
                  {step.status === 'completed' && (
                    <div className="p-1 bg-emerald-50 border border-emerald-250 rounded-full">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  )}
                  {step.status === 'active' && (
                    <div className="p-1 bg-white border border-emerald-500 rounded-full animate-spin">
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <div className="p-1 bg-slate-50 border border-slate-200 rounded-full">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-200" />
                    </div>
                  )}
                  {step.status === 'failed' && (
                    <div className="p-1 bg-red-50 border border-red-200 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-650" />
                    </div>
                  )}
                </div>

                <div>
                  <h4
                    className={`text-sm font-bold transition-colors ${
                      step.status === 'active'
                        ? 'text-emerald-650'
                        : step.status === 'completed'
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.name}
                  </h4>
                  <p className="text-slate-500 text-xs mt-1 leading-normal">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center py-6">
          <div className="inline-flex p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 shadow-inner">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-sans font-bold text-slate-900 tracking-tight">
            Generation Complete!
          </h2>
          <p className="text-slate-500 text-sm mt-3">
            StartupOS has built your business blueprint. Loading dashboard...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-6">
          <div className="inline-flex p-4 bg-red-50 border border-red-250 rounded-2xl mb-6 shadow-inner">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-sans font-bold text-slate-900 tracking-tight">
            Pipeline Failed
          </h2>
          <p className="text-red-650 text-sm mt-2 font-mono bg-red-50 p-3 rounded-lg border border-red-200 max-w-lg mx-auto">
            {errorMsg}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => setStatus('idle')}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
            >
              Go Back
            </button>
            <button
              onClick={handleLaunch}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all"
            >
              Retry Pipeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


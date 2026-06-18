'use server';

import { createClient } from '@/lib/db/server';
import { runOrchestrationPipeline } from '@/lib/agents/orchestrator';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { Client as QStashClient } from '@upstash/qstash';
import { checkUsageLimit } from '@/app/billing-actions';
import { trackAnalyticsEvent } from '@/app/analytics-actions';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

async function logAiGeneration(
  userId: string,
  workspaceId: string | null,
  agentType: string,
  usage?: { prompt_tokens?: number; completion_tokens?: number },
  startTime?: number,
  modelName?: string,
  status: 'success' | 'failed' = 'success',
  errorMessage?: string
) {
  try {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const cost = (promptTokens * 0.000000075) + (completionTokens * 0.0000003);
    const latencyMs = startTime ? Math.round(performance.now() - startTime) : 0;

    const { error } = await supabaseAdmin
      .from('ai_generation_logs')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        agent_type: agentType,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        cost: cost,
        latency_ms: latencyMs,
        model: modelName || 'google/gemini-2.5-flash',
        status: status,
        error_message: errorMessage || null,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.warn('[Generator logAiGeneration] Full insert failed, falling back to base columns:', error.message);
      await supabaseAdmin
        .from('ai_generation_logs')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          agent_type: agentType,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          cost: cost,
          latency_ms: latencyMs,
          created_at: new Date().toISOString()
        });
    }
  } catch (err) {
    console.error('Failed to log AI generation:', err);
  }
}

export async function generateStartupOS(workspaceId: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  if (isDemoMode) {
    // Simulate generation latency
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Set a cookie to persist the generation state locally
    const cookieStore = await cookies();
    cookieStore.set(`generated-${workspaceId}`, 'true', { maxAge: 3600 });

    return { success: true, message: 'AI Co-founder intelligence generated successfully!' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const rateLimitResult = await checkRateLimit(user.id);
  if (!rateLimitResult.success) {
    return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
  }

  // Verify collaborator role (minimum: admin)
  const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
    workspace_id: workspaceId,
    min_role: 'admin'
  });

  if (roleError || !hasRole) {
    return { success: false, error: 'Unauthorized access to this workspace.' };
  }

  // Enforce AI generation limit
  const limitCheck = await checkUsageLimit('generation', workspaceId);
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.message };
  }

  // Track AI generation event and first AI generation event if applicable
  await trackAnalyticsEvent('ai_generation', 'ai_generation_run', { workspaceId }).catch(() => {});
  try {
    const { count } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_name', 'ai_generation_run');
    if (!count || count === 0) {
      await trackAnalyticsEvent('ai_generation', 'first_ai_generation', { workspaceId, userId: user.id }).catch(() => {});
    }
  } catch (err) {
    // Silent catch
  }

  // 1.5. Clean up any stale jobs for this workspace first
  await cleanupStaleJobs(workspaceId);

  // Verify that there are no active jobs running for this workspace (concurrency lock)
  const { data: activeJob, error: activeJobError } = await supabase
    .from('jobs')
    .select('id')
    .eq('workspace_id', workspaceId)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeJobError) {
    console.error('Failed to verify active job presence:', activeJobError.message);
    return { success: false, error: 'Database verification failed.' };
  }

  if (activeJob) {
    return { success: false, error: 'A generation is already in progress.' };
  }

  // 2. Create job tracking record in Supabase
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      workspace_id: workspaceId,
      status: 'pending',
      progress: 0,
      current_step: 'Initializing agent workflow queue...',
      step_status: {
        research: 'pending',
        branding: 'pending',
        finance: 'pending',
        strategy: 'pending',
        marketing: 'pending',
      },
    })
    .select('id')
    .single();

  if (jobError || !job) {
    console.error('Failed to create job tracking record:', jobError);
    return { success: false, error: `Failed to initialize job tracking: ${jobError?.message || 'Unknown error'}` };
  }

  const jobId = job.id;

  // 3. Trigger queue (QStash) or local async fallback
  const qstashToken = process.env.QSTASH_TOKEN;
  const hasQStashConfig = qstashToken && qstashToken !== 'placeholder_token' && qstashToken.trim() !== '';

  if (hasQStashConfig) {
    try {
      const qstashClient = new QStashClient({ token: qstashToken });
      
      // Determine base app URL (production or localhost tunnel)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      const cleanBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
      const endpoint = `${cleanBaseUrl}/api/jobs/orchestrator`;

      console.log(`[QStash] Publishing background agent job to receiver: ${endpoint}`);

      await qstashClient.publishJSON({
        url: endpoint,
        body: {
          workspaceId,
          userId: user.id,
          jobId
        }
      });

      console.log(`[QStash] Successfully published background processing job ${jobId}`);
      return { success: true, message: 'AI Co-founder agents queued for background processing.', jobId };
    } catch (qstashErr: any) {
      console.error('[QStash] Queue dispatch failed, falling back to local background execution:', qstashErr);
      // Fall through to local fallback
    }
  }

  // Local/Dev asynchronous fallback (fire-and-forget promise loop)
  console.log(`[Local Fallback] Spawning local background agent pipeline for workspace ${workspaceId} (Job: ${jobId})`);
  
  // Start the orchestration pipeline asynchronously (without await)
  (async () => {
    try {
      await runOrchestrationPipeline(workspaceId, user.id);
    } catch (pipelineErr) {
      console.error(`[Local Fallback Background Process] Orchestration execution error:`, pipelineErr);
    }
  })();

  return { 
    success: true, 
    message: 'AI Co-founder agents execution started in the background (dev fallback).', 
    jobId 
  };
}

export interface GeneratedIdea {
  name: string;
  tagline: string;
  description: string;
  industry: string;
  profitability_score: number;
  difficulty_score: number;
  fit_justification: string;
  execution_path: string[];
}

/**
 * Generate 3 tailored startup ideas based on user profile inputs
 */
export async function generateStartupIdeas(
  interests: string,
  budget: string,
  skills: string,
  targetMarket: string
): Promise<{ success: boolean; data?: GeneratedIdea[]; error?: string; circuitBreakerActive?: boolean; logId?: string }> {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  if (isDemoMode) {
    // Return mock generated startup ideas for local testing
    await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate brief latency
    const mockIdeas: GeneratedIdea[] = [
      {
        name: 'EcoThread India',
        tagline: 'Organic. Affordable. Yours.',
        description: 'A direct-to-consumer apparel brand bringing certified organic cotton clothing to Indian college campuses at competitive price points.',
        industry: 'Sustainable Fashion / E-commerce',
        profitability_score: 85,
        difficulty_score: 45,
        fit_justification: 'Fits your ₹50,000 budget perfectly since it focuses on local suppliers and direct-to-consumer print-on-demand setups. Complements your design and social media marketing skills.',
        execution_path: [
          'Source certified cotton fabric from local farmers and printers in Tiruppur.',
          'Build and launch a lightweight Shopify storefront with Instagram checkout.',
          'Recruit campus ambassadors in metropolitan colleges to launch micro-influencer campaigns.'
        ]
      },
      {
        name: 'ChaiCampus',
        tagline: 'Hot premium tea, delivered on-demand to your desk.',
        description: 'An app-based express tea and snack delivery service targeting college libraries, study spaces, and hostel common rooms.',
        industry: 'Food & Beverage / Logistics',
        profitability_score: 90,
        difficulty_score: 35,
        fit_justification: 'Highly profitable with very low starting cost. Complements your logistics management and basic web dev skills to set up the express ordering dashboard.',
        execution_path: [
          'Partner with 3 popular tea stalls surrounding local colleges for supply.',
          'Deploy a simple Telegram bot for orders, tracking, and payments.',
          'Hire 2 students as delivery runners on an hourly commission basis.'
        ]
      },
      {
        name: 'SkillSync India',
        tagline: 'The student micro-gig network.',
        description: 'A hyper-local freelance platform connecting students who have technical skills with local small business owners looking for low-cost digital services.',
        industry: 'Professional Services / Gig Tech',
        profitability_score: 80,
        difficulty_score: 55,
        fit_justification: 'Software-based project. Requires no physical inventory, which matches your budget constraints. Leverages your basic coding skills to structure the directory.',
        execution_path: [
          'Develop a web directory listing student profiles and services offered.',
          'Onboard 20 skilled student freelancers (design, writing, video editing).',
          'Market directly to local shop owners, restaurants, and startups in the city.'
        ]
      }
    ];
    return { success: true, data: mockIdeas };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  if (!user) {
    return { success: false, error: 'Unauthorized. Please sign in to generate startup ideas.' };
  }

  const rateLimitResult = await checkRateLimit(user.id);
  if (!rateLimitResult.success) {
    return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
  }

  const startTime = performance.now();
  try {
    const { getGenerativeModel } = require('@/lib/gemini');
    const model = getGenerativeModel('gemini-1.5-flash');

    const prompt = `
      You are an AI Startup Generator co-founder. Suggest 3 detailed startup ideas based on the following user profile:
      - Interests: ${interests}
      - Skills: ${skills}
      - Budget: ₹${budget}
      - Target Market: ${targetMarket}

      Return a JSON array of objects, where each object has this schema:
      [
        {
          "name": "Creative Brand Name",
          "tagline": "Sleek and memorable slogan",
          "description": "Comprehensive description of what the startup does, how it operates, and its value proposition",
          "industry": "e.g., E-commerce / Tech / Health",
          "profitability_score": 85, // Integer 0-100
          "difficulty_score": 40, // Integer 0-100
          "fit_justification": "Explanation of why this idea fits their skills and budget constraint",
          "execution_path": [
            "Milestone 1 description",
            "Milestone 2 description",
            "Milestone 3 description"
          ]
        }
      ]
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsedIdeas = JSON.parse(response.response.text()) as GeneratedIdea[];
    const parsedUsage = (response as any).usage;
    await logAiGeneration(user.id, null, 'idea_generation', parsedUsage, startTime, response.modelUsed || 'google/gemini-2.5-flash', 'success');
    return { success: true, data: parsedIdeas, circuitBreakerActive: response.circuitBreakerActive };
  } catch (err: any) {
    const logId = `LOG-IDEAS-${Date.now()}`;
    console.error(`[generator-actions] AI generation failed (${logId}):`, err);
    await logAiGeneration(
      user.id,
      null,
      'idea_generation',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. The generator is temporarily overloaded or returned invalid data. Please try again.',
      logId
    };
  }
}

/**
 * Automatically marks jobs that are processing but have not been updated
 * in more than 15 minutes as failed with a timeout message.
 */
export async function cleanupStaleJobs(workspaceId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    // Find stale processing/pending jobs for this workspace
    const { data: staleJobs, error: selectError } = await supabase
      .from('jobs')
      .select('id')
      .eq('workspace_id', workspaceId)
      .in('status', ['pending', 'processing'])
      .lt('updated_at', fifteenMinutesAgo);

    if (selectError) {
      console.error('[Cleanup Stale Jobs] Error selecting stale jobs:', selectError.message);
      return;
    }

    if (staleJobs && staleJobs.length > 0) {
      console.log(`[Cleanup Stale Jobs] Found ${staleJobs.length} stale job(s) for workspace ${workspaceId}. Marking as failed.`);
      const staleIds = staleJobs.map(j => j.id);
      
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status: 'failed',
          error_message: 'Job timed out.',
          updated_at: new Date().toISOString()
        })
        .in('id', staleIds);

      if (updateError) {
        console.error('[Cleanup Stale Jobs] Error updating stale jobs:', updateError.message);
      }
    }
  } catch (err: any) {
    console.error('[Cleanup Stale Jobs] Exception in cleanup:', err.message || err);
  }
}


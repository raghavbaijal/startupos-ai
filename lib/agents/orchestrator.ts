import { createClient } from '@supabase/supabase-js';
import { getGenerativeModel } from '../gemini';
import { matchWorkspaceMemories } from '../vector-store';

// Initialize Clients
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Interfaces for Agent Responses
interface AgentResponse {
  success: boolean;
  data: any;
  error?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  modelUsed?: string;
}

export async function updateJobProgress(
  workspaceId: string,
  progress: number,
  currentStep: string,
  stepUpdates: Record<string, 'pending' | 'active' | 'completed' | 'failed'>
) {
  try {
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('[Orchestrator] Error fetching job:', fetchError.message);
      return;
    }

    if (!job) {
      console.warn(`[Orchestrator] No active job found to update for workspace ${workspaceId}`);
      return;
    }

    const updatedStepStatus = {
      ...job.step_status,
      ...stepUpdates
    };

    const { error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({
        status: progress === 100 ? 'completed' : 'processing',
        progress,
        current_step: currentStep,
        step_status: updatedStepStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    if (updateError) {
      console.error('[Orchestrator] Error updating job:', updateError.message);
    }
  } catch (err) {
    console.error('[Orchestrator] Exception in updateJobProgress:', err);
  }
}

/**
 * Audit Logger for AI Generations
 */
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
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const cost = (promptTokens * 0.000000075) + (completionTokens * 0.0000003); // Estimate based on Gemini-2.5-flash pricing on OpenRouter
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
      console.warn('[Orchestrator logAiGeneration] Full insert failed, falling back to base columns:', error.message);
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
    } else {
      console.log(`[Orchestrator] AI generation logged successfully for ${agentType} (Cost: $${cost.toFixed(6)}, Latency: ${latencyMs}ms, Model: ${modelName}, Status: ${status})`);
    }
  } catch (err) {
    console.error(`[Orchestrator] Failed to log AI generation for ${agentType}:`, err);
  }
}

/**
 * Main Orchestrator for StartupOS AI
 * Manages memory retrieval, agent execution order, DB persistence, and vector indexing.
 */
export async function runOrchestrationPipeline(workspaceId: string, userId: string): Promise<AgentResponse> {
  try {
    // 1. Fetch Workspace Context
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      throw new Error(`Failed to retrieve workspace context: ${wsError?.message}`);
    }

    // Initialize progress
    await updateJobProgress(workspaceId, 5, 'Retrieving historical context and vector memories...', {});

    // 2. Fetch Relevant Memories (RAG)
    const queryText = `Startup: ${workspace.name}. Industry: ${workspace.industry}. Description: ${workspace.description}`;
    const memories = await retrieveVectorMemories(workspaceId, queryText);
    const memoryString = memories.map((m: any) => m.content).join('\n---\n');

    // 3. Phase 1: Sequential Agent Execution with Detailed Status Reporting
    // Market Research
    await updateJobProgress(workspaceId, 10, 'Analyzing market demand, customer personas, and competition...', { research: 'active' });
    const resStart = performance.now();
    const researchResult = await runMarketResearchAgent(workspace, memoryString);
    if (!researchResult.success) {
      await logAiGeneration(userId, workspaceId, 'market_research', { prompt_tokens: 0, completion_tokens: 0 }, resStart, 'google/gemini-2.5-pro', 'failed', researchResult.error || 'Market Research agent failed during processing.');
      await updateJobProgress(workspaceId, 10, 'Market research analysis failed.', { research: 'failed' });
      throw new Error(researchResult.error || 'Market Research agent failed during processing.');
    }
    await logAiGeneration(userId, workspaceId, 'market_research', researchResult.usage, resStart, researchResult.modelUsed || 'google/gemini-2.5-pro', 'success');

    // Pacing delay to prevent rate limits
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Branding
    await updateJobProgress(workspaceId, 30, 'Market research completed. Formulating brand names, positioning, and assets...', { research: 'completed', branding: 'active' });
    const brandStart = performance.now();
    const brandingResult = await runBrandingAgent(workspace, memoryString);
    if (!brandingResult.success) {
      await logAiGeneration(userId, workspaceId, 'branding', { prompt_tokens: 0, completion_tokens: 0 }, brandStart, 'google/gemini-2.5-flash', 'failed', brandingResult.error || 'Branding agent failed during processing.');
      await updateJobProgress(workspaceId, 30, 'Branding development failed.', { branding: 'failed' });
      throw new Error(brandingResult.error || 'Branding agent failed during processing.');
    }
    await logAiGeneration(userId, workspaceId, 'branding', brandingResult.usage, brandStart, brandingResult.modelUsed || 'google/gemini-2.5-flash', 'success');

    // Pacing delay to prevent rate limits
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Finance
    await updateJobProgress(workspaceId, 50, 'Branding assets designed. Generating startup cost breakdowns and financial projections...', { branding: 'completed', finance: 'active' });
    const finStart = performance.now();
    const financeResult = await runFinanceAgent(workspace, memoryString);
    if (!financeResult.success) {
      await logAiGeneration(userId, workspaceId, 'finance', { prompt_tokens: 0, completion_tokens: 0 }, finStart, 'google/gemini-2.5-flash', 'failed', financeResult.error || 'Finance agent failed during processing.');
      await updateJobProgress(workspaceId, 50, 'Financial forecasting failed.', { finance: 'failed' });
      throw new Error(financeResult.error || 'Finance agent failed during processing.');
    }
    await logAiGeneration(userId, workspaceId, 'finance', financeResult.usage, finStart, financeResult.modelUsed || 'google/gemini-2.5-flash', 'success');

    // 4. Phase 2: Sequential Agent Execution
    const contextForPhase2 = {
      workspace,
      research: researchResult.data,
      branding: brandingResult.data,
      finance: financeResult.data,
      memories: memoryString
    };

    // Pacing delay to prevent rate limits
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Strategy
    await updateJobProgress(workspaceId, 70, 'Financial planning completed. Structuring 30/90 day execution roadmaps...', { finance: 'completed', strategy: 'active' });
    const stratStart = performance.now();
    const strategyResult = await runStrategyAgent(contextForPhase2);
    if (!strategyResult.success) {
      await logAiGeneration(userId, workspaceId, 'strategy', { prompt_tokens: 0, completion_tokens: 0 }, stratStart, 'google/gemini-2.5-flash', 'failed', strategyResult.error || 'Strategy agent failed during processing.');
      await updateJobProgress(workspaceId, 70, 'Execution strategy roadmap failed.', { strategy: 'failed' });
      throw new Error(strategyResult.error || 'Strategy agent failed during processing.');
    }
    await logAiGeneration(userId, workspaceId, 'strategy', strategyResult.usage, stratStart, strategyResult.modelUsed || 'google/gemini-2.5-flash', 'success');

    // Pacing delay to prevent rate limits
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Marketing
    await updateJobProgress(workspaceId, 85, 'Roadmaps structured. Generating multi-channel copy, email sequences, and calendars...', { strategy: 'completed', marketing: 'active' });
    const markStart = performance.now();
    const marketingResult = await runMarketingAgent(contextForPhase2);
    if (!marketingResult.success) {
      await logAiGeneration(userId, workspaceId, 'marketing', { prompt_tokens: 0, completion_tokens: 0 }, markStart, 'google/gemini-2.5-flash', 'failed', marketingResult.error || 'Marketing agent failed during processing.');
      await updateJobProgress(workspaceId, 85, 'Marketing copy creation failed.', { marketing: 'failed' });
      throw new Error(marketingResult.error || 'Marketing agent failed during processing.');
    }
    await logAiGeneration(userId, workspaceId, 'marketing', marketingResult.usage, markStart, marketingResult.modelUsed || 'google/gemini-2.5-flash', 'success');

    await updateJobProgress(workspaceId, 95, 'Synthesizing knowledge graphs and vector memory partitions...', { marketing: 'completed' });

    // 5. Generate Vector Memory Embeddings (No mock fallbacks)
    const memoryBlocks = [
      `Market Gaps and SWOT opportunities identified: ${JSON.stringify(researchResult.data.market_gaps)}. Differentiation approach: ${researchResult.data.differentiation_strategy}`,
      `Selected brand positioning statement: ${brandingResult.data.positioning_statement}`,
      `Starting budget constraint is ₹${workspace.budget || 'unspecified'}. Break even target numbers: ${JSON.stringify(financeResult.data.break_even_analysis)}`
    ];

    const embedModel = getGenerativeModel('text-embedding-004');
    const vectorMemoriesPayload = await Promise.all(
      memoryBlocks.map(async (text) => {
        let embeddingValues;
        try {
          const result = await embedModel.embedContent(text);
          embeddingValues = result.embedding.values;
        } catch (embedErr: any) {
          console.error('[Orchestrator] Embedding generation failed. Rejecting partial execution.', embedErr.message || embedErr);
          throw new Error(`Embedding generation failed: ${embedErr.message || embedErr}`);
        }
        return {
          content: text,
          embedding: embeddingValues,
          metadata: { source: 'agent_generation', timestamp: new Date().toISOString() }
        };
      })
    );

    // 6. Save All Results Atomically
    await updateJobProgress(workspaceId, 98, 'Committing all knowledge base structures to secure persistent vault...', {});
    await saveAllOutputsWithRetry(
      workspaceId,
      researchResult.data,
      brandingResult.data,
      financeResult.data,
      strategyResult.data,
      marketingResult.data,
      vectorMemoriesPayload
    );

    // 7. Log Workspace events for the timeline
    try {
      // Clean up previous agent-generated timeline events first to prevent duplicates on retry
      const { error: cleanupErr } = await supabaseAdmin
        .from('workspace_events')
        .delete()
        .eq('workspace_id', workspaceId)
        .in('event_type', ['report', 'branding', 'finance', 'roadmap', 'marketing']);

      if (cleanupErr) {
        console.warn('[Orchestrator] Error cleaning up previous timeline events:', cleanupErr.message);
      }

      await Promise.all([
        supabaseAdmin.from('workspace_events').insert({
          workspace_id: workspaceId,
          event_type: 'report',
          title: 'Validation Report Compiled',
          description: `AI agents completed feasibility verification with score: ${researchResult.data.feasibility_score}%`,
          metadata: { score: researchResult.data.feasibility_score }
        }),
        supabaseAdmin.from('workspace_events').insert({
          workspace_id: workspaceId,
          event_type: 'branding',
          title: 'Brand Profile Generated',
          description: `Generated brand positioning statement: "${brandingResult.data.positioning_statement.substring(0, 60)}..."`,
          metadata: { positioning: brandingResult.data.positioning_statement }
        }),
        supabaseAdmin.from('workspace_events').insert({
          workspace_id: workspaceId,
          event_type: 'finance',
          title: 'Financial Projections Calculated',
          description: `Calculated P&L forecasts, overhead target, and startup costs checklist.`,
          metadata: { costsCount: financeResult.data.startup_costs?.length }
        }),
        supabaseAdmin.from('workspace_events').insert({
          workspace_id: workspaceId,
          event_type: 'roadmap',
          title: 'Roadmaps Configured',
          description: `Aligned weekly objectives and 30/90 day execution roadmaps.`,
          metadata: { plan30Count: strategyResult.data.plan_30_day?.length }
        }),
        supabaseAdmin.from('workspace_events').insert({
          workspace_id: workspaceId,
          event_type: 'marketing',
          title: 'Marketing Campaigns Created',
          description: `Generated 14-day content calendar copy across Instagram and LinkedIn.`,
          metadata: { calendarCount: marketingResult.data.content_calendar?.length }
        })
      ]);
      console.log('[Orchestrator] Successfully logged timeline events.');
    } catch (timelineErr) {
      console.error('[Orchestrator] Failed to log timeline events:', timelineErr);
    }

    // Complete Job status update
    await updateJobProgress(workspaceId, 100, 'All agents executed successfully! Launching workspace dashboard...', {});

    return {
      success: true,
      data: {
        message: 'Startup generation pipeline executed successfully.',
        stagesCompleted: ['research', 'branding', 'finance', 'strategy', 'marketing']
      }
    };

  } catch (error: any) {
    console.error('Orchestration Pipeline Error:', error);
    
    // Attempt to report failure in jobs table
    try {
      const { data: job } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (job) {
        await supabaseAdmin
          .from('jobs')
          .update({
            status: 'failed',
            error_message: error.message || 'An unexpected error occurred during generation.',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    } catch (dbErr) {
      console.error('Failed to update job status to failed:', dbErr);
    }

    return {
      success: false,
      data: null,
      error: error.message || 'An unexpected error occurred during generation.'
    };
  }
}

/* =========================================================================
   SPECIALIZED AGENT INVOCATION FUNCTIONS (STUBBED TO SHOW SYSTEM FLOW)
   ========================================================================= */

async function runMarketResearchAgent(workspace: any, memory: string): Promise<AgentResponse> {
  try {
    const model = getGenerativeModel('gemini-1.5-pro'); // Enforce strict reasoning model
    const prompt = `
      You are the Market Research Agent for StartupOS AI. 
      Analyze the following startup idea and provide a structured JSON response:
      - Name: ${workspace.name}
      - Description: ${workspace.description}
      - Industry: ${workspace.industry}
      - Target Market: ${workspace.target_market}
      - Budget: ${workspace.budget}
      
      Previous Workspace Context & Historical Memories:
      ${memory || "No previous memory."}
      
      Return:
      - feasibility_score (0-100)
      - profitability_score (0-100)
      - difficulty_score (0-100)
      - market_demand (analysis text, max 2 sentences)
      - competition_summary (analysis text, max 2 sentences)
      - risk_analysis (JSON object listing 2 risks & mitigation)
      - swot_analysis (JSON with strengths, weaknesses, opportunities, threats lists, max 2 items each)
      - market_gaps (array of 2 strings)
      - differentiation_strategy (text, max 2 sentences)
      - competitors (array of 2 objects representing direct/indirect competitors: { name: string, website: string, market_share: string, strengths: string[], weaknesses: string[], estimated_pricing: string, differentiation: string })
    `;
    
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    
    return {
      success: true,
      data: JSON.parse(response.response.text()),
      usage: (response as any).usage
    };
  } catch (error: any) {
    console.error('[Orchestrator] Market Research agent LLM call failed:', error.message || error);
    return {
      success: false,
      data: null,
      error: error.message || 'Market Research agent LLM call failed.'
    };
  }
}

async function runBrandingAgent(workspace: any, memory: string): Promise<AgentResponse> {
  try {
    const model = getGenerativeModel('gemini-1.5-flash'); // Faster generative model for naming/slogans
    const prompt = `
      You are the Branding Agent. Develop a visual identity and names for:
      Startup Name: ${workspace.name}
      Description: ${workspace.description}
      
      Previous Workspace Context & Historical Memories:
      ${memory || "No previous memory."}
      
      Return a JSON structure containing:
      - brand_names: Array of 3 objects: { name: string, justification: string, availability: string }
      - slogans: Array of 3 strings
      - positioning_statement: string (max 2 sentences)
      - color_palette: object containing primary, secondary, accent, and background HEX values.
      - logo_prompts: Array of 2 image generation prompts (e.g. Midjourney style)
    `;
    
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    
    return {
      success: true,
      data: JSON.parse(response.response.text()),
      usage: (response as any).usage
    };
  } catch (error: any) {
    console.error('[Orchestrator] Branding agent LLM call failed:', error.message || error);
    return {
      success: false,
      data: null,
      error: error.message || 'Branding agent LLM call failed.'
    };
  }
}

async function runFinanceAgent(workspace: any, memory: string): Promise<AgentResponse> {
  try {
    const model = getGenerativeModel('gemini-1.5-pro');
    const prompt = `
      You are the Finance Agent. Formulate financial estimates based on:
      Budget: ${workspace.budget}
      Industry: ${workspace.industry}
      Description: ${workspace.description}
      
      Previous Workspace Context & Historical Memories:
      ${memory || "No previous memory."}
      
      Return a JSON structure containing:
      - startup_costs: List of 3 asset/expense item objects { item: string, cost: number }
      - revenue_projections: 6-month array of projected monthly revenue numbers
      - break_even_analysis: { fixed_monthly_overhead: number, revenue_per_unit: number, margin_percentage: number }
      - expense_forecasts: List of 3 projected monthly operational costs
    `;
    
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    
    return {
      success: true,
      data: JSON.parse(response.response.text()),
      usage: (response as any).usage
    };
  } catch (error: any) {
    console.error('[Orchestrator] Finance agent LLM call failed:', error.message || error);
    return {
      success: false,
      data: null,
      error: error.message || 'Finance agent LLM call failed.'
    };
  }
}

async function runStrategyAgent(context: any): Promise<AgentResponse> {
  try {
    const model = getGenerativeModel('gemini-1.5-pro');
    const prompt = `
      You are the Strategy Agent. Design execution roadmaps using the following inputs:
      Startup Idea: ${context.workspace.name}
      Description: ${context.workspace.description}
      Market Gaps: ${JSON.stringify(context.research.market_gaps)}
      Estimated Launch Costs: ${JSON.stringify(context.finance.startup_costs)}
      
      Previous Workspace Context & Historical Memories:
      ${context.memories || "No previous memory."}
      
      Return a JSON structure containing:
      - plan_30_day: 2-week objectives list { week: number, goal: string, tasks: string[] }
      - plan_90_day: 2-month milestones list { month: number, target: string, sub_milestones: string[] }
      - launch_roadmap: Step-by-step launch tasks list (max 3 items)
      - growth_roadmap: List of initial growth channels & targets (max 3 items)
    `;
    
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    
    return {
      success: true,
      data: JSON.parse(response.response.text()),
      usage: (response as any).usage
    };
  } catch (error: any) {
    console.error('[Orchestrator] Strategy agent LLM call failed:', error.message || error);
    return {
      success: false,
      data: null,
      error: error.message || 'Strategy agent LLM call failed.'
    };
  }
}

async function runMarketingAgent(context: any): Promise<AgentResponse> {
  try {
    const model = getGenerativeModel('gemini-1.5-flash');
    const prompt = `
      You are the Marketing Agent. Generate high-converting campaign copy:
      Product: ${context.workspace.name}
      Description: ${context.workspace.description}
      Brand Positioning: ${context.branding.positioning_statement}
      Target Market: ${context.workspace.target_market}
      
      Previous Workspace Context & Historical Memories:
      ${context.memories || "No previous memory."}
      
      Return a JSON structure containing:
      - instagram_campaigns: Array of 2 posts { image_idea: string, caption: string, hashtags: string[] }
      - linkedin_campaigns: Array of 2 posts { hook: string, body: string }
      - email_sequences: 2 onboarding emails { subject: string, body: string, trigger_day: number }
      - ad_copy: { google: string[], meta: string[], linkedin: string[] } (max 1 each)
      - content_calendar: 3-day schedule list { day: number, platform: string, topic: string }
    `;
    
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    
    return {
      success: true,
      data: JSON.parse(response.response.text()),
      usage: (response as any).usage
    };
  } catch (error: any) {
    console.error('[Orchestrator] Marketing agent LLM call failed:', error.message || error);
    return {
      success: false,
      data: null,
      error: error.message || 'Marketing agent LLM call failed.'
    };
  }
}

/* =========================================================================
   TRANSACTIONAL SAVE WITH RETRY & LOGGING
   ========================================================================= */

async function saveAllOutputsWithRetry(
  workspaceId: string,
  researchData: any,
  brandingData: any,
  financeData: any,
  strategyData: any,
  marketingData: any,
  vectorMemoriesPayload: any[],
  maxRetries = 3
): Promise<void> {
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`[Orchestrator] Attempting to save all agent outputs atomically (Attempt ${attempt}/${maxRetries})`);
      
      const { data, error } = await supabaseAdmin.rpc('save_orchestrator_results_v1', {
        target_workspace_id: workspaceId,
        research_json: researchData,
        competitors_json: researchData.competitors || [],
        branding_json: brandingData,
        finance_json: financeData,
        strategy_json: strategyData,
        marketing_json: marketingData,
        vector_memories_json: vectorMemoriesPayload
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('RPC returned false execution status.');
      }

      console.log(`[Orchestrator] All agent outputs successfully committed atomically.`);
      return;
    } catch (err: any) {
      console.error(`[Orchestrator] Transaction save failed on attempt ${attempt}:`, err.message || err);
      if (attempt >= maxRetries) {
        throw new Error(`Orchestration database transaction failed after ${maxRetries} attempts: ${err.message}`);
      }
      console.log(`[Orchestrator] Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

async function retrieveVectorMemories(workspaceId: string, query: string): Promise<any[]> {
  try {
    const model = getGenerativeModel('text-embedding-004');
    const result = await model.embedContent(query);
    const queryEmbedding = result.embedding.values;

    return await matchWorkspaceMemories(workspaceId, queryEmbedding);
  } catch (err) {
    console.error('Vector memory search failed:', err);
    return [];
  }
}

/* =========================================================================
   GRACEFUL LLM FAILURE MOCK GENERATORS
   ========================================================================= */

function getMockMarketResearch(workspace: any) {
  return {
    feasibility_score: 85,
    profitability_score: 80,
    difficulty_score: 45,
    market_demand: `Strong demand identified for "${workspace.name}" in the ${workspace.industry || 'target'} sector, driven by increasing consumer interest and lack of direct local solutions.`,
    competition_summary: "Moderate competition with a few established legacy players, leaving significant room for a modern, digitally native entrant.",
    risk_analysis: {
      "Customer Acquisition Cost": "High initial marketing spend required. Mitigation: Leverage organic social channels and micro-influencer content.",
      "Operational Scalability": "Logistics and service delivery bottlenecks. Mitigation: Partner with third-party providers for early operations."
    },
    swot_analysis: {
      strengths: ["Highly tailored solution", "Low starting overhead", "Niche market focus"],
      weaknesses: ["New brand awareness", "Limited initial resource constraints"],
      opportunities: ["Unserved digital audience segment", "Potential partnership scaling"],
      threats: ["Low barrier to copy entry", "Rapid market shifts"]
    },
    market_gaps: [
      "Lack of direct-to-consumer localized delivery",
      "Legacy platforms offer poor mobile user experience"
    ],
    differentiation_strategy: `Position "${workspace.name}" as the premier modern, user-friendly alternative tailored specifically for ${workspace.target_market || 'consumers'}.`,
    competitors: [
      {
        name: "Legacy incumbent Corp",
        website: "https://legacycorp.com",
        market_share: "45%",
        strengths: ["Deep pockets", "Established brand"],
        weaknesses: ["Slow iteration", "High pricing"],
        estimated_pricing: "Premium",
        differentiation: "We focus on agility and lower costs."
      },
      {
        name: "Local alternative Ltd",
        website: "https://localalt.com",
        market_share: "15%",
        strengths: ["Local presence"],
        weaknesses: ["Manual processes", "No mobile app"],
        estimated_pricing: "Mid-tier",
        differentiation: "Fully automated digital workflow."
      }
    ]
  };
}

function getMockBranding(workspace: any) {
  return {
    brand_names: [
      { name: `${workspace.name} Go`, justification: "Simple, action-oriented naming", availability: "Available" },
      { name: `${workspace.name} Hub`, justification: "Positioning as a central service platform", availability: "Available" },
      { name: `Vibe${workspace.name}`, justification: "Appeals to younger demographics", availability: "Available" }
    ],
    slogans: [
      "The future of local solutions.",
      "Smart. Simple. Yours.",
      "Engineered for convenience."
    ],
    positioning_statement: `For ${workspace.target_market || 'consumers'} who value ease and speed, "${workspace.name}" is the modern service that simplifies daily lives.`,
    color_palette: {
      primary: "#6366F1",
      secondary: "#4F46E5",
      accent: "#10B981",
      background: "#F9FAFB"
    },
    logo_prompts: [
      "Minimalist vector logo, geometric shape representing connection, indigo and teal palette, white background.",
      "Modern abstract brand mark, clean lines, typography-focused icon, SVG format."
    ]
  };
}

function getMockFinance(workspace: any) {
  const budgetVal = parseFloat(String(workspace.budget || '100000').replace(/[^0-9.]/g, '')) || 100000;
  return {
    startup_costs: [
      { item: "Software Licensing & Tool Stack", cost: Math.round(budgetVal * 0.15) },
      { item: "Initial Marketing & Advertising Campaign", cost: Math.round(budgetVal * 0.25) },
      { item: "Legal Registration & Setup Fees", cost: Math.round(budgetVal * 0.10) }
    ],
    revenue_projections: [
      Math.round(budgetVal * 0.05),
      Math.round(budgetVal * 0.10),
      Math.round(budgetVal * 0.18),
      Math.round(budgetVal * 0.28),
      Math.round(budgetVal * 0.40),
      Math.round(budgetVal * 0.55)
    ],
    break_even_analysis: {
      fixed_monthly_overhead: Math.round(budgetVal * 0.08),
      revenue_per_unit: Math.round(budgetVal * 0.02),
      margin_percentage: 75
    },
    expense_forecasts: [
      { item: "Server hosting & Cloud APIs", cost: Math.round(budgetVal * 0.02) },
      { item: "Paid acquisition channels", cost: Math.round(budgetVal * 0.05) },
      { item: "Administrative operational support", cost: Math.round(budgetVal * 0.03) }
    ]
  };
}

function getMockStrategy(workspace: any) {
  return {
    plan_30_day: [
      { week: 1, goal: "Setup operations and landing page", tasks: ["Finalize branding colors", "Launch simple email signup form"] },
      { week: 2, goal: "Initial target customer feedback", tasks: ["Share prototype with 10 prospects", "Refine value proposition"] }
    ],
    plan_90_day: [
      { month: 1, target: "Launch beta service", sub_milestones: ["Onboard first 25 beta users", "Iterate based on usage"] },
      { month: 2, target: "Acquisition scale-up", sub_milestones: ["Initiate micro-influencer outreach", "Track conversion funnel"] }
    ],
    launch_roadmap: [
      "Incorporate company and secure domain names",
      "Deploy beta application to staging environments",
      "Open access to private waitlist subscribers"
    ],
    growth_roadmap: [
      "Organic referral loops offering premium incentives",
      "Direct outreach targeting community groups",
      "Search Engine Optimization (SEO) landing pages"
    ]
  };
}

function getMockMarketing(workspace: any) {
  return {
    instagram_campaigns: [
      { image_idea: `Close-up shot of target consumer using "${workspace.name}" platform`, caption: "Simplify your daily routine in just one tap. 🚀", hashtags: ["productivity", "startup", "convenience"] },
      { image_idea: "Modern flat-lay aesthetic showing branding colors", caption: "Design meets functionality. Welcome to the future.", hashtags: ["brand", "ux", "launch"] }
    ],
    linkedin_campaigns: [
      { hook: `Why we built ${workspace.name}: to solve the unaddressed gap in the market.`, body: "Our mission is to empower teams and individuals by streamlining operations." },
      { hook: "Legacy systems are costing companies hours of productivity.", body: "Here is how our lightweight, automated solution fixes the bottleneck." }
    ],
    email_sequences: [
      { subject: `Welcome to ${workspace.name}!`, body: "Thank you for joining our exclusive early beta list.", trigger_day: 1 },
      { subject: "Quick tip: How to get started", body: "Here is a 2-minute guide on setting up your workspace.", trigger_day: 3 }
    ],
    ad_copy: {
      google: [`Official ${workspace.name} | Try Free Today`, "Modern service tailored for you. Sign up in seconds."],
      meta: [`Stop wasting time. Get started with ${workspace.name}.`],
      linkedin: [`Scale your workflow. Try ${workspace.name} today.`]
    },
    content_calendar: [
      { day: 1, platform: "Instagram", topic: "Product Launch Announcement" },
      { day: 2, platform: "LinkedIn", topic: "Behind the Scenes Founder Story" },
      { day: 3, platform: "Instagram", topic: "User testimonial highlight" }
    ]
  };
}

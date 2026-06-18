'use server';

import { createClient } from '@/lib/db/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/resend';
import { headers } from 'next/headers';
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
      console.warn('[Workspace logAiGeneration] Full insert failed, falling back to base columns:', error.message);
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

/**
 * Create a new startup workspace
 */
export async function createWorkspace(formData: FormData) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  if (isDemoMode) {
    const name = formData.get('name') as string;
    const industry = formData.get('industry') as string;
    const description = formData.get('description') as string;
    const targetMarket = formData.get('targetMarket') as string;
    const budgetStr = formData.get('budget') as string;
    
    if (!name || !industry || !description || !targetMarket || !budgetStr) {
      redirect(`/workspaces/new?error=${encodeURIComponent('All fields are required.')}`);
    }
    const randId = 'demo-new-' + Math.floor(Math.random() * 100000);
    redirect(`/workspaces/${randId}`);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Enforce workspace limit
  const limitCheck = await checkUsageLimit('workspace');
  if (!limitCheck.allowed) {
    redirect(`/workspaces/new?error=${encodeURIComponent(limitCheck.message || '')}`);
  }

  const name = formData.get('name') as string;
  const industry = formData.get('industry') as string;
  const description = formData.get('description') as string;
  const targetMarket = formData.get('targetMarket') as string;
  const budgetStr = formData.get('budget') as string;
  const stage = (formData.get('stage') as string) || 'ideation';

  // Basic validation
  if (!name || !industry || !description || !targetMarket || !budgetStr) {
    redirect(`/workspaces/new?error=${encodeURIComponent('All fields are required.')}`);
  }

  const budget = parseFloat(budgetStr.replace(/,/g, ''));
  if (isNaN(budget) || budget <= 0) {
    redirect(`/workspaces/new?error=${encodeURIComponent('Invalid budget amount.')}`);
  }

  const { data: newWorkspace, error } = await supabase
    .from('workspaces')
    .insert({
      user_id: user.id,
      name,
      industry,
      description,
      target_market: targetMarket,
      budget,
      stage,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create workspace failed:', error.message);
    redirect(`/workspaces/new?error=${encodeURIComponent(error.message)}`);
  }

  // Track workspace created event
  await trackAnalyticsEvent('workspace_create', 'workspace_created', { workspaceId: newWorkspace.id, name }).catch(() => {});

  revalidatePath('/');
  redirect(`/workspaces/${newWorkspace.id}`);
}

export async function createWorkspaceOnboarding(formData: FormData) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  if (isDemoMode) {
    const name = formData.get('name') as string;
    const industry = formData.get('industry') as string;
    const description = formData.get('description') as string;
    const targetMarket = formData.get('targetMarket') as string;
    const budgetStr = formData.get('budget') as string;
    
    if (!name || !industry || !description || !targetMarket || !budgetStr) {
      redirect(`/?error=${encodeURIComponent('All fields are required.')}`);
    }
    const randId = 'demo-new-' + Math.floor(Math.random() * 100000);
    redirect(`/workspaces/${randId}?onboarding=true`);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Enforce workspace limit
  const limitCheck = await checkUsageLimit('workspace');
  if (!limitCheck.allowed) {
    redirect(`/?error=${encodeURIComponent(limitCheck.message || '')}`);
  }

  const name = formData.get('name') as string;
  const industry = formData.get('industry') as string;
  const description = formData.get('description') as string;
  const targetMarket = formData.get('targetMarket') as string;
  const budgetStr = formData.get('budget') as string;
  const stage = (formData.get('stage') as string) || 'ideation';

  // Basic validation
  if (!name || !industry || !description || !targetMarket || !budgetStr) {
    redirect(`/?error=${encodeURIComponent('All fields are required.')}`);
  }

  const budget = parseFloat(budgetStr.replace(/,/g, ''));
  if (isNaN(budget) || budget <= 0) {
    redirect(`/?error=${encodeURIComponent('Invalid budget amount.')}`);
  }

  const { data: newWorkspace, error } = await supabase
    .from('workspaces')
    .insert({
      user_id: user.id,
      name,
      industry,
      description,
      target_market: targetMarket,
      budget,
      stage,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create workspace onboarding failed:', error.message);
    redirect(`/?error=${encodeURIComponent(error.message)}`);
  }

  // Track workspace created event
  await trackAnalyticsEvent('workspace_create', 'workspace_created', { workspaceId: newWorkspace.id, name }).catch(() => {});

  revalidatePath('/');
  redirect(`/workspaces/${newWorkspace.id}?onboarding=true`);
}


/**
 * Delete an existing startup workspace
 */
export async function deleteWorkspace(workspaceId: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  if (isDemoMode) {
    redirect('/');
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete workspace failed:', error.message);
    redirect(`/workspaces/${workspaceId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/');
  redirect('/');
}

/**
 * Adopt a generated startup idea and create its workspace
 */
export async function adoptGeneratedIdea(
  ideaJson: string,
  budgetStr: string,
  skillsStr: string,
  targetMarketStr: string
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  const idea = JSON.parse(ideaJson);

  if (isDemoMode) {
    const randId = 'demo-new-' + Math.floor(Math.random() * 100000);
    redirect(`/workspaces/${randId}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const budget = parseFloat(budgetStr.replace(/,/g, '')) || 0;

  const { data: newWorkspace, error } = await supabase
    .from('workspaces')
    .insert({
      user_id: user.id,
      name: idea.name,
      industry: idea.industry,
      description: idea.description,
      target_market: targetMarketStr,
      budget,
      stage: 'ideation',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Adopt idea failed:', error.message);
    redirect(`/generator?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/');
  redirect(`/workspaces/${newWorkspace.id}`);
}

/**
 * Generate custom brand names suggestions based on keywords
 */
export async function generateCustomNames(keywords: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    return {
      success: true,
      data: [
        { name: `${keywords}ly`, justification: "Modern tech suffix for connectivity", availability: "Available" },
        { name: `${keywords} Flow`, justification: "Focuses on speed and smooth operations", availability: "Available" },
        { name: `Apex ${keywords}`, justification: "Signals peak performance and quality", availability: "Available" },
        { name: `${keywords} Hub`, justification: "Positioning as a central platform", availability: "Available" },
        { name: `Nova${keywords}`, justification: "Suggests innovation and fresh starts", availability: "Available" }
      ]
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const rateLimitResult = await checkRateLimit(user?.id);
  if (!rateLimitResult.success) {
    return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
  }

  const limitCheck = await checkUsageLimit('generation');
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.message };
  }

  const startTime = performance.now();
  try {
    const { getGenerativeModel } = require('@/lib/gemini');
    const model = getGenerativeModel('gemini-1.5-flash');

    const prompt = `
      Suggest 5 memorable and creative brand name ideas matching the keywords: "${keywords}".
      For each name, provide a short justification.
      
      Return a JSON array of objects with this schema:
      [
        {
          "name": "Brand Name",
          "justification": "Why this name fits the keywords",
          "availability": "Available"
        }
      ]
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const result = JSON.parse(response.response.text());
    await logAiGeneration(user?.id || 'anonymous', null, 'custom_names', (response as any).usage, startTime, response.modelUsed || 'google/gemini-2.5-flash', 'success');
    return { success: true, data: result, circuitBreakerActive: response.circuitBreakerActive };
  } catch (err: any) {
    const logId = `LOG-NAMES-${Date.now()}`;
    console.error(`Generate custom names failed (${logId}):`, err);
    await logAiGeneration(
      user?.id || 'anonymous',
      null,
      'custom_names',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. Naming service temporarily unavailable. Please try again.',
      logId
    };
  }
}

/**
 * Generate custom taglines based on a voice tone and description
 */
export async function generateCustomTaglines(voice: string, description: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    return {
      success: true,
      data: [
        `The smarter way to handle ${description.substring(0, 20)}...`,
        `Empowering your ${voice} journey.`,
        `Innovation meeting convenience.`,
        `Next-generation solutions for growth.`,
        `Simplify, optimize, succeed.`
      ]
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const rateLimitResult = await checkRateLimit(user?.id);
  if (!rateLimitResult.success) {
    return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
  }

  const limitCheck = await checkUsageLimit('generation');
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.message };
  }

  const startTime = performance.now();
  try {
    const { getGenerativeModel } = require('@/lib/gemini');
    const model = getGenerativeModel('gemini-1.5-flash');

    const prompt = `
      Generate 5 catchphrases/taglines for a startup with this description: "${description}".
      The slogans should reflect a tone that is "${voice}".
      
      Return a JSON array of strings:
      [
        "Tagline suggestion 1",
        "Tagline suggestion 2",
        "Tagline suggestion 3",
        "Tagline suggestion 4",
        "Tagline suggestion 5"
      ]
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const result = JSON.parse(response.response.text());
    await logAiGeneration(user?.id || 'anonymous', null, 'custom_taglines', (response as any).usage, startTime, response.modelUsed || 'google/gemini-2.5-flash', 'success');
    return { success: true, data: result, circuitBreakerActive: response.circuitBreakerActive };
  } catch (err: any) {
    const logId = `LOG-TAGLINES-${Date.now()}`;
    console.error(`Generate custom taglines failed (${logId}):`, err);
    await logAiGeneration(
      user?.id || 'anonymous',
      null,
      'custom_taglines',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. Tagline service temporarily unavailable. Please try again.',
      logId
    };
  }
}

/**
 * Generate custom color palette based on visual vibe
 */
export async function generateCustomPalette(vibe: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    return {
      success: true,
      data: {
        primary: "#6366F1",
        secondary: "#4F46E5",
        accent: "#10B981",
        background: "#F9FAFB"
      }
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const rateLimitResult = await checkRateLimit(user?.id);
  if (!rateLimitResult.success) {
    return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
  }

  const limitCheck = await checkUsageLimit('generation');
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.message };
  }

  const startTime = performance.now();
  try {
    const { getGenerativeModel } = require('@/lib/gemini');
    const model = getGenerativeModel('gemini-1.5-flash');

    const prompt = `
      Create a modern, matching 4-color palette for a startup with a vibe that is "${vibe}".
      Include Primary, Secondary, Accent, and Background colors as HEX strings.
      
      Return a JSON object with this schema:
      {
        "primary": "#HEXCODE",
        "secondary": "#HEXCODE",
        "accent": "#HEXCODE",
        "background": "#HEXCODE"
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const result = JSON.parse(response.response.text());
    await logAiGeneration(user?.id || 'anonymous', null, 'custom_palette', (response as any).usage, startTime, response.modelUsed || 'google/gemini-2.5-flash', 'success');
    return { success: true, data: result, circuitBreakerActive: response.circuitBreakerActive };
  } catch (err: any) {
    const logId = `LOG-PALETTE-${Date.now()}`;
    console.error(`Generate custom palette failed (${logId}):`, err);
    await logAiGeneration(
      user?.id || 'anonymous',
      null,
      'custom_palette',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. Palette service temporarily unavailable. Please try again.',
      logId
    };
  }
}

/**
 * Generate custom Midjourney/DALL-E prompts for logos based on style
 */
export async function generateCustomLogoPrompts(style: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    return {
      success: true,
      data: [
        `Minimalist vector logo, geometric shape representing connection, style: ${style}, indigo and teal palette.`,
        `Modern abstract brand mark, clean lines, typography-focused icon, style: ${style}, SVG format.`,
        `Sleek futuristic logo concept, subtle gradients, style: ${style}, high contrast.`
      ]
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const rateLimitResult = await checkRateLimit(user?.id);
  if (!rateLimitResult.success) {
    return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
  }

  const limitCheck = await checkUsageLimit('generation');
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.message };
  }

  const startTime = performance.now();
  try {
    const { getGenerativeModel } = require('@/lib/gemini');
    const model = getGenerativeModel('gemini-1.5-flash');

    const prompt = `
      Generate 3 highly detailed image generation prompts (for DALL-E or Midjourney) to design a logo in a style that is "${style}".
      Keep each prompt descriptive, setting art style, elements, and color palette parameters.
      
      Return a JSON array of strings:
      [
        "Prompt description 1",
        "Prompt description 2",
        "Prompt description 3"
      ]
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const result = JSON.parse(response.response.text());
    await logAiGeneration(user?.id || 'anonymous', null, 'custom_logo_prompts', (response as any).usage, startTime, response.modelUsed || 'google/gemini-2.5-flash', 'success');
    return { success: true, data: result, circuitBreakerActive: response.circuitBreakerActive };
  } catch (err: any) {
    const logId = `LOG-LOGOS-${Date.now()}`;
    console.error(`Generate custom logo prompts failed (${logId}):`, err);
    await logAiGeneration(
      user?.id || 'anonymous',
      null,
      'custom_logo_prompts',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. Logo prompt generator temporarily unavailable. Please try again.',
      logId
    };
  }
}

/**
 * Save brand profile selections to Supabase
 */
export async function saveBrandProfile(
  workspaceId: string,
  profile: {
    brand_name: string;
    tagline: string;
    brand_voice: string;
    color_palette: any;
    logo_prompt: string;
  }
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  if (isDemoMode) {
    return { success: true, message: 'Brand profile saved locally (Demo mode).' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch existing row to preserve unique workspace records without unique key constraint issues
    const { data: existingAsset } = await supabase
      .from('branding_assets')
      .select('id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const recordToSave: any = {
      workspace_id: workspaceId,
      brand_name: profile.brand_name,
      tagline: profile.tagline,
      brand_voice: profile.brand_voice,
      color_palette: profile.color_palette,
      logo_prompt: profile.logo_prompt,
      updated_at: new Date().toISOString()
    };

    if (existingAsset?.id) {
      recordToSave.id = existingAsset.id;
    }

    const { error: upsertError } = await supabase
      .from('branding_assets')
      .upsert(recordToSave);

    if (upsertError) {
      console.error('Error saving brand profile:', upsertError.message);
      return { success: false, error: upsertError.message };
    }

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true, message: 'Brand profile successfully committed to database!' };
  } catch (err: any) {
    console.error('Save brand profile failed:', err);
    return { success: false, error: err.message || 'Failed to save brand profile.' };
  }
}

/**
 * Generate a custom roadmap matching a specific focus area using google/gemini-2.5-flash
 */
export async function generateCustomRoadmap(workspaceId: string, focusArea: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  if (isDemoMode) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      data: {
        plan_30_day: [
          { week: 1, goal: `Initiate plan focused on: ${focusArea}`, tasks: ['Draft initial requirements doc', 'Map primary features list'] },
          { week: 2, goal: 'Develop proof of concept', tasks: ['Set up database structures', 'Build lightweight API endpoints'] },
          { week: 3, goal: 'Internal testing iteration', tasks: ['Run end-to-end user actions checks', 'Benchmark performance metrics'] },
          { week: 4, goal: 'Prepare product launch campaign', tasks: ['Register beta domains', 'Initialize brand marketing copy'] }
        ],
        plan_90_day: [
          { month: 1, target: 'Beta Store Release', sub_milestones: ['Deploy cloud host configurations', 'Seed database profiles', 'Run alpha testers loop'] },
          { month: 2, target: 'Affiliate Marketing Launch', sub_milestones: ['Design partner rewards dashboard', 'Onboard 10 promoter leads', 'Send affiliate promo links'] },
          { month: 3, target: 'Iterative Scale & Ads', sub_milestones: ['Optimize SEO and content calendar', 'Budget social ads conversions', 'Draft expansion roadmap'] }
        ],
        launch_roadmap: [
          'Publish official launch press statement',
          'Deploy payment gateways and checkouts',
          'Blast product announcement to early signups newsletter list',
          'Activate limited-time beta promo discounts code'
        ],
        growth_roadmap: [
          'Onboard 20 micro-influencers for review campaigns',
          'SEO content marketing and weekly newsletter updates',
          'Hyper-local campus student referral discount codes'
        ]
      }
    };
  }

  const startTime = performance.now();
  let userId = 'anonymous';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }
    userId = user.id;

    const rateLimitResult = await checkRateLimit(user.id);
    if (!rateLimitResult.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
    }

    const limitCheck = await checkUsageLimit('generation', workspaceId);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.message };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch workspace details
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return { success: false, error: 'Workspace not found.' };
    }

    const { getGenerativeModel } = require('@/lib/gemini');
    const model = getGenerativeModel('gemini-1.5-flash');

    const prompt = `
      You are the Strategy Agent for StartupOS AI. 
      Generate a customized launch and growth roadmap based on the following context:
      - Startup Name: ${workspace.name}
      - Industry: ${workspace.industry}
      - Description: ${workspace.description}
      - Target Market: ${workspace.target_market}
      - Roadmap Focus Area / Custom Parameters: ${focusArea}
      
      Return a JSON structure containing:
      {
        "plan_30_day": [
          { "week": 1, "goal": "Objective for Week 1", "tasks": ["Task 1 description", "Task 2 description"] },
          { "week": 2, "goal": "Objective for Week 2", "tasks": ["Task 1 description", "Task 2 description"] },
          { "week": 3, "goal": "Objective for Week 3", "tasks": ["Task 1 description", "Task 2 description"] },
          { "week": 4, "goal": "Objective for Week 4", "tasks": ["Task 1 description", "Task 2 description"] }
        ],
        "plan_90_day": [
          { "month": 1, "target": "Objective/Target for Month 1", "sub_milestones": ["Milestone 1", "Milestone 2"] },
          { "month": 2, "target": "Objective/Target for Month 2", "sub_milestones": ["Milestone 1", "Milestone 2"] },
          { "month": 3, "target": "Objective/Target for Month 3", "sub_milestones": ["Milestone 1", "Milestone 2"] }
        ],
        "launch_roadmap": [
          "Launch action item 1",
          "Launch action item 2",
          "Launch action item 3",
          "Launch action item 4"
        ],
        "growth_roadmap": [
          "Growth marketing channel/metric target 1",
          "Growth marketing channel/metric target 2",
          "Growth marketing channel/metric target 3"
        ]
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsedData = JSON.parse(response.response.text());
    await logAiGeneration(
      userId,
      workspaceId,
      'custom_roadmap',
      (response as any).usage,
      startTime,
      response.modelUsed || 'google/gemini-2.5-flash',
      'success'
    );
    return { success: true, data: parsedData, circuitBreakerActive: response.circuitBreakerActive };
  } catch (err: any) {
    const logId = `LOG-ROADMAP-${Date.now()}`;
    console.error(`Generate custom roadmap failed (${logId}):`, err);
    await logAiGeneration(
      userId,
      workspaceId,
      'custom_roadmap',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. Roadmap service temporarily unavailable. Please try again.',
      logId
    };
  }
}

/**
 * Save custom roadmap inputs to Supabase database
 */
export async function saveWorkspaceRoadmap(
  workspaceId: string,
  roadmapData: {
    plan_30_day: any[];
    plan_90_day: any[];
    launch_roadmap: string[];
    growth_roadmap: string[];
  }
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  if (isDemoMode) {
    return { success: true, message: 'Roadmap saved locally (Demo mode).' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch existing row to preserve unique workspace records without unique key constraint issues
    const { data: existingRoadmap } = await supabase
      .from('roadmaps')
      .select('id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const recordToSave: any = {
      workspace_id: workspaceId,
      plan_30_day: roadmapData.plan_30_day,
      plan_90_day: roadmapData.plan_90_day,
      launch_roadmap: roadmapData.launch_roadmap,
      growth_roadmap: roadmapData.growth_roadmap,
      updated_at: new Date().toISOString()
    };

    if (existingRoadmap?.id) {
      recordToSave.id = existingRoadmap.id;
    }

    const { error: upsertError } = await supabase
      .from('roadmaps')
      .upsert(recordToSave);

    if (upsertError) {
      console.error('Error saving roadmap:', upsertError.message);
      return { success: false, error: upsertError.message };
    }

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true, message: 'Roadmap successfully saved to database!' };
  } catch (err: any) {
    console.error('Save roadmap failed:', err);
    return { success: false, error: err.message || 'Failed to save roadmap.' };
  }
}

/**
 * Generate a custom marketing strategy and copywriting assets matching a campaign focus area
 */
export async function generateCustomMarketing(workspaceId: string, focusArea: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  if (isDemoMode) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      data: {
        instagram_campaigns: [
          { 
            image_idea: `Close-up shot of products with overlay text: "${focusArea}"`, 
            caption: `Exciting news! We are launching our brand new campaign focused on ${focusArea}. Join the wave!`, 
            hashtags: ['newlaunch', 'fashiontrends', 'startupstyle'] 
          },
          { 
            image_idea: 'Behind the scenes video showing how our hoodies are printed.', 
            caption: 'Quality, care, and attention to detail. That is how we manufacture our campus streetwear catalog.', 
            hashtags: ['behindthescenes', 'streetwear', 'madeinindia'] 
          }
        ],
        linkedin_campaigns: [
          { 
            hook: 'Why fast fashion is dying and hyper-local sustainable print-on-demand is the future of student clothing.', 
            body: `We did the research. Modern campus audiences care about transparency. Here is how we are building a brand matching their values: \n1. Direct-to-consumer print loops.\n2. Local cotton farm sourcing.\nLet's disrupt standard supply chains.` 
          },
          { 
            hook: 'Building a startup with ₹50,000 budget is challenging, but focus makes it achievable.', 
            body: `Our strategy for the launch campaign is focused on: ${focusArea}. By targeting micro-influencers and student reps, we bypass expensive ad overhead. Here is our execution blueprint.` 
          }
        ],
        email_sequences: [
          { 
            subject: `Welcome to the movement! Early access details on: ${focusArea}`, 
            body: `Hey there,\n\nThanks for joining our pre-launch squad. We are launching our premium campaign themed around ${focusArea} very soon.\n\nUse code FIRST15 to grab a 15% discount on early inventory releases.\n\nBest,\nFounders`, 
            trigger_day: 1 
          },
          { 
            subject: 'Fabric check: Certified organic cotton vs standard poly blends', 
            body: 'Hi friend,\n\nWe wanted to share how our hoodies are manufactured. We source local certified cotton that stays soft and feels premium without toxic dye chemicals.\n\nCheck out our collections on our storefront.\n\nBest,\nFounders', 
            trigger_day: 3 
          }
        ],
        ad_copy: {
          google: [
            `Organic Campus Hoodies | Premium Cotton | Shop Local: ${focusArea}`,
            'Sustainable Sweatpants India | Certified Cotton Wear | Free Campus Delivery'
          ],
          meta: [
            `Finally, eco-friendly streetwear that doesn't break the student budget. Introducing our launch campaign focused on ${focusArea}. Tap to buy!`,
            'Zero toxic dyes, 100% certified cotton, and college-ready designs. Get 15% off your first order today.'
          ],
          linkedin: [
            `Direct-to-consumer sustainability for corporate retreats and campus reps. Learn how we are scaling our supply chains: ${focusArea}`,
            'Partner with the next generation of eco-apparel. Discover our student freelancer network directory.'
          ]
        },
        content_calendar: [
          { day: 1, platform: 'instagram', topic: `Campaign launch announcement: ${focusArea}` },
          { day: 3, platform: 'linkedin', topic: 'Sharing sustainable clothing supply chain analysis' },
          { day: 5, platform: 'instagram', topic: 'Close up fabric quality and dye process features' },
          { day: 7, platform: 'email', topic: 'Early bird pre-order code broadcast' },
          { day: 10, platform: 'linkedin', topic: 'Founder story: bootstrapping with a ₹50,000 budget' },
          { day: 12, platform: 'instagram', topic: 'Highlighting local farmer cooperatives' },
          { day: 14, platform: 'instagram', topic: 'Interactive stories poll: choose the next hoodie design' }
        ]
      }
    };
  }

  const startTime = performance.now();
  let userId = 'anonymous';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }
    userId = user.id;

    const rateLimitResult = await checkRateLimit(user.id);
    if (!rateLimitResult.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
    }

    const limitCheck = await checkUsageLimit('generation', workspaceId);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.message };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch workspace details
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return { success: false, error: 'Workspace not found.' };
    }

    const { getGenerativeModel } = require('@/lib/gemini');
    const model = getGenerativeModel('gemini-1.5-flash');

    const prompt = `
      You are the Marketing Agent for StartupOS AI. 
      Generate a customized marketing and advertising copy plan based on the following context:
      - Startup Name: ${workspace.name}
      - Industry: ${workspace.industry}
      - Description: ${workspace.description}
      - Target Market: ${workspace.target_market}
      - Campaign Focus Area / Custom Parameters: ${focusArea}
      
      Return a JSON structure containing:
      {
        "instagram_campaigns": [
          { "image_idea": "Description of image or graphic idea", "caption": "Engaging caption with hooks", "hashtags": ["tag1", "tag2", "tag3"] },
          { "image_idea": "Description of image or graphic idea 2", "caption": "Engaging caption 2", "hashtags": ["tag3", "tag4", "tag5"] }
        ],
        "linkedin_campaigns": [
          { "hook": "Engaging professional hook line", "body": "Structured body copy explaining industry problems/insights" },
          { "hook": "Insightful hook line 2", "body": "Body copy 2" }
        ],
        "email_sequences": [
          { "subject": "Welcome/Subject 1", "body": "Email body content with call-to-actions", "trigger_day": 1 },
          { "subject": "Subject 2", "body": "Email body content 2", "trigger_day": 3 },
          { "subject": "Subject 3", "body": "Email body content 3", "trigger_day": 7 }
        ],
        "ad_copy": {
          "google": ["Google Search ad copy 1", "Google Search ad copy 2"],
          "meta": ["Facebook/Instagram ad copy 1", "Facebook/Instagram ad copy 2"],
          "linkedin": ["LinkedIn B2B ad copy 1", "LinkedIn B2B ad copy 2"]
        },
        "content_calendar": [
          { "day": 1, "platform": "instagram", "topic": "Announcement topic" },
          { "day": 3, "platform": "linkedin", "topic": "Industry insight topic" },
          { "day": 5, "platform": "blog", "topic": "Content/SEO topic" },
          { "day": 7, "platform": "instagram", "topic": "Product highlight topic" },
          { "day": 10, "platform": "email", "topic": "Newsletter broadcast" },
          { "day": 12, "platform": "linkedin", "topic": "Customer success story" },
          { "day": 14, "platform": "instagram", "topic": "Giveaway/Promo code launch" }
        ]
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsedData = JSON.parse(response.response.text());
    await logAiGeneration(
      userId,
      workspaceId,
      'custom_marketing',
      (response as any).usage,
      startTime,
      response.modelUsed || 'google/gemini-2.5-flash',
      'success'
    );
    return { success: true, data: parsedData, circuitBreakerActive: response.circuitBreakerActive };
  } catch (err: any) {
    const logId = `LOG-MARKETING-${Date.now()}`;
    console.error(`Generate custom marketing failed (${logId}):`, err);
    await logAiGeneration(
      userId,
      workspaceId,
      'custom_marketing',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. Marketing service temporarily unavailable. Please try again.',
      logId
    };
  }
}

/**
 * Save custom marketing engine outputs to Supabase database
 */
export async function saveWorkspaceMarketing(
  workspaceId: string,
  marketingData: {
    instagram_campaigns: any[];
    linkedin_campaigns: any[];
    email_sequences: any[];
    ad_copy: any;
    content_calendar: any[];
  }
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  if (isDemoMode) {
    return { success: true, message: 'Marketing plan saved locally (Demo mode).' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch existing row to preserve unique workspace records without unique key constraint issues
    const { data: existingMarketing } = await supabase
      .from('marketing_plans')
      .select('id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const recordToSave: any = {
      workspace_id: workspaceId,
      instagram_campaigns: marketingData.instagram_campaigns,
      linkedin_campaigns: marketingData.linkedin_campaigns,
      email_sequences: marketingData.email_sequences,
      ad_copy: marketingData.ad_copy,
      content_calendar: marketingData.content_calendar,
      updated_at: new Date().toISOString()
    };

    if (existingMarketing?.id) {
      recordToSave.id = existingMarketing.id;
    }

    const { error: upsertError } = await supabase
      .from('marketing_plans')
      .upsert(recordToSave);

    if (upsertError) {
      console.error('Error saving marketing plans:', upsertError.message);
      return { success: false, error: upsertError.message };
    }

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true, message: 'Marketing plans successfully committed to database!' };
  } catch (err: any) {
    console.error('Save marketing plan failed:', err);
    return { success: false, error: err.message || 'Failed to save marketing plan.' };
  }
}

/**
 * Generate a custom financial model and projection strategy matching budget limits and custom parameters using google/gemini-2.5-flash
 */
export async function generateCustomFinance(workspaceId: string, focusArea: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  if (isDemoMode) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      data: {
        startup_costs: [
          { item: 'Inventory Production Setup', cost: 30000 },
          { item: 'Digital Marketing Launch Ads', cost: 8000 },
          { item: 'Web Domain & Store hosting', cost: 4000 },
          { item: 'Logistics and courier contracts', cost: 3000 },
          { item: 'Packaging and brand tags design', cost: 5000 }
        ],
        revenue_projections: [12000, 15000, 20000, 25000, 32000, 40000, 50000, 62000, 75000, 90000, 105000, 120000],
        expense_forecasts: [7000, 7500, 9000, 10000, 12000, 14000, 17000, 20000, 24000, 28000, 32000, 36000],
        break_even_analysis: {
          fixed_monthly_overhead: 6000,
          revenue_per_unit: 800,
          margin_percentage: 65
        }
      }
    };
  }

  const startTime = performance.now();
  let userId = 'anonymous';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }
    userId = user.id;

    // Rate limit check
    const rateLimitResult = await checkRateLimit(user.id);
    if (!rateLimitResult.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
    }

    const limitCheck = await checkUsageLimit('generation', workspaceId);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.message };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch workspace details
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return { success: false, error: 'Workspace not found.' };
    }

    const { getGenerativeModel } = require('@/lib/gemini');
    const model = getGenerativeModel('gemini-1.5-flash');

    const prompt = `
      You are the Finance Agent for StartupOS AI. 
      Generate a customized financial forecasting model based on the following context:
      - Startup Name: ${workspace.name}
      - Industry: ${workspace.industry}
      - Description: ${workspace.description}
      - Target Market: ${workspace.target_market}
      - Total Budget Constraint: ₹${workspace.budget}
      - Custom Assumptions / Financial Strategy Focus: ${focusArea}
      
      Requirements:
      1. Ensure all startup costs are realistic for the industry and sum up close to or below the total budget limit.
      2. The revenue projections must cover a 12-month timeline and reflect a growth trajectory.
      3. The expense forecasts must cover a 12-month timeline (representing monthly operating costs).
      4. The break-even analysis should calculate the monthly overhead and profit margin parameter.
      
      Return a JSON structure containing:
      {
        "startup_costs": [
          { "item": "Name of expense/asset item", "cost": 15000 }
        ],
        "revenue_projections": [12000, 15000, 18000, 22000, 26000, 31000, 37000, 44000, 52000, 60000, 70000, 80000],
        "expense_forecasts": [6000, 6200, 6500, 7000, 7400, 8000, 8505, 9200, 10000, 10800, 11500, 12500],
        "break_even_analysis": {
          "fixed_monthly_overhead": 8000,
          "revenue_per_unit": 750,
          "margin_percentage": 60
        }
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsedData = JSON.parse(response.response.text());
    await logAiGeneration(
      userId,
      workspaceId,
      'custom_finance',
      (response as any).usage,
      startTime,
      response.modelUsed || 'google/gemini-2.5-flash',
      'success'
    );
    return { success: true, data: parsedData, circuitBreakerActive: response.circuitBreakerActive };
  } catch (err: any) {
    const logId = `LOG-FINANCE-${Date.now()}`;
    console.error(`Generate custom finance failed (${logId}):`, err);
    await logAiGeneration(
      userId,
      workspaceId,
      'custom_finance',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. Financial model generator temporarily unavailable. Please try again.',
      logId
    };
  }
}

/**
 * Save custom financial forecasting to Supabase database
 */
export async function saveWorkspaceFinance(
  workspaceId: string,
  financeData: {
    startup_costs: any[];
    revenue_projections: number[];
    expense_forecasts: number[];
    break_even_analysis: any;
  }
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  if (isDemoMode) {
    return { success: true, message: 'Financial projections saved locally (Demo mode).' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch existing row to preserve unique workspace records without unique key constraint issues
    const { data: existingFinance } = await supabase
      .from('financial_projections')
      .select('id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const recordToSave: any = {
      workspace_id: workspaceId,
      startup_costs: financeData.startup_costs,
      revenue_projections: financeData.revenue_projections,
      expense_forecasts: financeData.expense_forecasts,
      break_even_analysis: financeData.break_even_analysis,
      updated_at: new Date().toISOString()
    };

    if (existingFinance?.id) {
      recordToSave.id = existingFinance.id;
    }

    const { error: upsertError } = await supabase
      .from('financial_projections')
      .upsert(recordToSave);

    if (upsertError) {
      console.error('Error saving financial projections:', upsertError.message);
      return { success: false, error: upsertError.message };
    }

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true, message: 'Financial projections successfully committed to database!' };
  } catch (err: any) {
    console.error('Save financial projections failed:', err);
    return { success: false, error: err.message || 'Failed to save financial projections.' };
  }
}

/**
 * Generate a custom pitch deck structure matching a focus area using google/gemini-2.5-flash
 */
export async function generateCustomPitchDeck(workspaceId: string, focusArea: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  if (isDemoMode) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      data: {
        problem_statement: `Traditional solutions for this market are highly outdated. Target audiences are demanding a modern alternative that matches focus: ${focusArea}`,
        solution: `Our platform delivers direct, automated, and hyper-personalized solutions that cut standard operational delays by 75%.`,
        market_size: {
          tam: '₹2,500 Cr (Indian Target Industry size)',
          sam: '₹500 Cr (Regional addressable segment)',
          som: '₹15 Cr (Our target launch scale)'
        },
        business_model: 'SaaS subscription tier matching startup capabilities, transaction commissions, and customized integration add-ons.',
        go_to_market: 'D2C campus rep referral loops, localized organic social media launches, and early waitlist onboarding program.',
        slides: [
          { title: 'The Problem', content: `High operational friction, high entry budgets, and outdated solutions limit growth. Focus details: ${focusArea}`, visual_layout_suggestion: 'Left side key pain points list. Right side comparative cost graph.' },
          { title: 'The Solution', content: 'Our tool automates workflows and offers a unified dashboard matching client goals.', visual_layout_suggestion: 'Centred UI screenshot mockup with highlighted key components.' },
          { title: 'Market Opportunity', content: 'Gen-Z and college students are shifting towards digital-first setups. TAM of ₹2,500 Cr is ready for disruption.', visual_layout_suggestion: 'Pie chart showcasing TAM, SAM, SOM layers.' },
          { title: 'Monetization Plan', content: 'Three tier subscription model + 5% platform service transaction commissions.', visual_layout_suggestion: 'Pricing columns matching Free, Pro, Enterprise features.' },
          { title: 'GTM & Distribution', content: 'D2C college rep networks and direct micro-influencer referrals.', visual_layout_suggestion: 'Process workflow diagram showing customer onboarding loops.' }
        ]
      }
    };
  }

  const startTime = performance.now();
  let userId = 'anonymous';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }
    userId = user.id;

    // Rate limit check
    const rateLimitResult = await checkRateLimit(user.id);
    if (!rateLimitResult.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
    }

    const limitCheck = await checkUsageLimit('generation', workspaceId);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.message };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch workspace details
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return { success: false, error: 'Workspace not found.' };
    }

    const { getGenerativeModel } = require('@/lib/gemini');
    const model = getGenerativeModel('gemini-1.5-flash');

    const prompt = `
      You are the Pitch Deck Agent for StartupOS AI. 
      Generate a customized pitch deck outline based on the following context:
      - Startup Name: ${workspace.name}
      - Industry: ${workspace.industry}
      - Description: ${workspace.description}
      - Target Market: ${workspace.target_market}
      - Pitch Deck Assumptions Focus Area: ${focusArea}
      
      Requirements:
      Generate all core slides (Problem, Solution, TAM/SAM/SOM, Business Model, GTM strategy) and additional slides.
      
      Return a JSON structure containing:
      {
        "problem_statement": "Concise statement of the core problem in the market",
        "solution": "Concise statement of our product's solution",
        "market_size": {
          "tam": "TAM description",
          "sam": "SAM description",
          "som": "SOM description"
        },
        "business_model": "Monetization and business model description",
        "go_to_market": "GTM and customer acquisition strategy description",
        "slides": [
          { "title": "Slide Title 1", "content": "Text summary of the slide content", "visual_layout_suggestion": "Visual suggestion for slides design" },
          { "title": "Slide Title 2", "content": "Text summary 2", "visual_layout_suggestion": "Visual suggestion 2" }
        ]
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsedData = JSON.parse(response.response.text());
    await logAiGeneration(
      userId,
      workspaceId,
      'custom_pitch_deck',
      (response as any).usage,
      startTime,
      response.modelUsed || 'google/gemini-2.5-flash',
      'success'
    );
    return { success: true, data: parsedData, circuitBreakerActive: response.circuitBreakerActive };
  } catch (err: any) {
    const logId = `LOG-PITCH-${Date.now()}`;
    console.error(`Generate custom pitch deck failed (${logId}):`, err);
    await logAiGeneration(
      userId,
      workspaceId,
      'custom_pitch_deck',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. Pitch deck generator temporarily unavailable. Please try again.',
      logId
    };
  }
}

/**
 * Save custom pitch deck data to Supabase database
 */
export async function saveWorkspacePitchDeck(
  workspaceId: string,
  deckData: {
    problem_statement: string;
    solution: string;
    market_size: { tam: string; sam: string; som: string };
    business_model: string;
    go_to_market: string;
    slides: any[];
  }
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  
  if (isDemoMode) {
    return { success: true, message: 'Pitch deck saved locally (Demo mode).' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch existing row to preserve unique workspace records without unique key constraint issues
    const { data: existingDeck } = await supabase
      .from('pitch_decks')
      .select('id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const recordToSave: any = {
      workspace_id: workspaceId,
      problem_statement: deckData.problem_statement,
      solution: deckData.solution,
      market_size: deckData.market_size,
      business_model: deckData.business_model,
      go_to_market: deckData.go_to_market,
      slides: deckData.slides,
      updated_at: new Date().toISOString()
    };

    if (existingDeck?.id) {
      recordToSave.id = existingDeck.id;
    }

    const { error: upsertError } = await supabase
      .from('pitch_decks')
      .upsert(recordToSave);

    if (upsertError) {
      console.error('Error saving pitch deck:', upsertError.message);
      return { success: false, error: upsertError.message };
    }

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true, message: 'Pitch deck successfully committed to database!' };
  } catch (err: any) {
    console.error('Save pitch deck failed:', err);
    return { success: false, error: err.message || 'Failed to save pitch deck.' };
  }
}

/**
 * Generate custom landing page copywriting and React code using google/gemini-2.5-flash
 */
export async function generateCustomLandingPage(workspaceId: string, focusArea: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  if (isDemoMode) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      data: {
        hero: {
          title: `Direct-to-Consumer Organic Campus Wear - Custom Focus: ${focusArea}`,
          subtitle: 'Sustainable fashion made affordable for Indian college students. Feel good, look sharp, and protect the planet.',
          cta_text: 'Explore Collections',
          cta_url: '#collections'
        },
        features: [
          { title: '100% Certified Organic', description: 'GOTS certified organic cotton sourced from local cooperative farms in India.', icon: 'Leaf' },
          { title: 'Zero Waste Production', description: `We print on-demand specifically tailoring to ${focusArea} parameters.`, icon: 'Zap' },
          { title: 'Direct Peer Deliveries', description: 'Campus reps hand over your gear during lunch break. Zero shipping fees.', icon: 'Users' }
        ],
        pricing: [
          { name: 'Student Essential', price: '₹499', period: 'one-time', features: ['1 Organic Cotton Tee', 'Leaf visual badge', 'Direct Rep delivery'], is_popular: false, button_text: 'Pre-order Tee' },
          { name: 'Founder Hood Pack', price: '₹1,299', period: 'one-time', features: ['1 Premium fleece hoodie', 'WhatsApp Rep access', 'Priority drop notification'], is_popular: true, button_text: 'Pre-order Hoodie' },
          { name: 'Dorm Room Bundle', price: '₹2,499', period: 'one-time', features: ['3 Custom printed tees', '1 Hoodie', '1 canvas tote bag'], is_popular: false, button_text: 'Pre-order Bundle' }
        ],
        testimonials: [
          { name: 'Rohan Deshmukh', role: 'Student Rep', company: 'IIT Madras', content: 'Our cohort ordered the hoodies for our startup club. High quality materials, very soft, and super cool logo designs.' },
          { name: 'Priya Sen', role: 'Active Member', company: 'SRCC Delhi', content: 'Sustainability matters to us, but high price tags usually lock students out. This brand completely solves that problem!' }
        ],
        faqs: [
          { question: 'What organic certifications do your clothes have?', answer: 'Our supplier mills are GOTS-certified (Global Organic Textile Standard) guaranteeing ethical labor and organic growth.' },
          { question: 'Can I return if the size does not fit?', answer: 'Yes! Simply coordinate with your local campus ambassador for an instant exchange or refund within 7 days.' }
        ],
        code: `// Custom generated Next.js landing page component code here`
      }
    };
  }

  const startTime = performance.now();
  let userId = 'anonymous';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }
    userId = user.id;

    // Rate limit check
    const rateLimitResult = await checkRateLimit(user.id);
    if (!rateLimitResult.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a minute before generating again.' };
    }

    const limitCheck = await checkUsageLimit('generation', workspaceId);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.message };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch workspace details
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return { success: false, error: 'Workspace not found.' };
    }

    const { getGenerativeModel } = require('@/lib/gemini');
    const model = getGenerativeModel('gemini-1.5-flash');

    const prompt = `
      You are the Marketing and Web Design Agent for StartupOS AI.
      Generate a customized, professional, and visually stunning Landing Page data structure and Next.js React component code based on the following context:
      - Startup Name: ${workspace.name}
      - Industry: ${workspace.industry}
      - Description: ${workspace.description}
      - Target Market: ${workspace.target_market}
      - Campaign Focus Area: ${focusArea}
 
      Requirements:
      1. Write copy matching these sections: Hero, Features (3 items), Pricing (3 tiers), Testimonials (2 entries), and FAQs (2 entries).
      2. For the "code" field, write the complete Next.js React component (e.g. export default function LandingPage() { ... }).
      3. Design the code using high-end dark theme Tailwind CSS class utilities (e.g., slate-950 background, grid structures, rounded layouts, glassmorphism blur borders, glowing gradient text and buttons matching our emerald/indigo color systems).
      4. Make sure all interactive components in the code (billing toggle in pricing, FAQ accordions, testimonial slideshow arrows) are fully functional using React state hooks ('use state' logic, etc.).
      5. To prevent imports crash in standard builds, import simple standard icon components from 'lucide-react' (such as Leaf, Users, Check, ChevronDown, Sparkles, Globe, Star, ArrowRight, Shield, Zap) or use standard SVGs. Do not import any other custom external libraries or local components.
      
      Return a JSON structure containing:
      {
        "hero": {
          "title": "Hero title copy",
          "subtitle": "Compelling subtitle body copy",
          "cta_text": "CTA Button label",
          "cta_url": "#collections"
        },
        "features": [
          { "title": "Feature title", "description": "Short description of the benefit", "icon": "Leaf | Users | Zap | Star | Globe | Shield" }
        ],
        "pricing": [
          { "name": "Pricing Tier Name", "price": "e.g. ₹499", "period": "e.g. one-time", "features": ["Feature benefit 1", "Feature benefit 2"], "is_popular": false, "button_text": "Select Tier" }
        ],
        "testimonials": [
          { "name": "Reviewer Full Name", "role": "e.g. Campus Rep", "company": "e.g. DU", "content": "Review text" }
        ],
        "faqs": [
          { "question": "Question text", "answer": "Answer explanation" }
        ],
        "code": "/* Premium self-contained Next.js functional component TSX code starting with 'import ...' */"
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsedData = JSON.parse(response.response.text());
    await logAiGeneration(
      userId,
      workspaceId,
      'custom_landing_page',
      (response as any).usage,
      startTime,
      response.modelUsed || 'google/gemini-2.5-flash',
      'success'
    );
    return { success: true, data: parsedData, circuitBreakerActive: response.circuitBreakerActive };
  } catch (err: any) {
    const logId = `LOG-LANDING-${Date.now()}`;
    console.error(`Generate custom landing page failed (${logId}):`, err);
    await logAiGeneration(
      userId,
      workspaceId,
      'custom_landing_page',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. Landing page generator temporarily unavailable. Please try again.',
      logId
    };
  }
}

/**
 * Save custom landing page data to Supabase database
 */
export async function saveWorkspaceLandingPage(
  workspaceId: string,
  landingPageData: {
    hero: any;
    features: any[];
    pricing: any[];
    testimonials: any[];
    faqs: any[];
    code: string;
  }
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  if (isDemoMode) {
    return { success: true, message: 'Landing page saved locally (Demo mode).' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized user access.' };
    }

    // Verify collaborator role (minimum: editor)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    // Fetch existing row to preserve unique workspace records without unique key constraint issues
    const { data: existingPage } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    const recordToSave: any = {
      workspace_id: workspaceId,
      hero: landingPageData.hero,
      features: landingPageData.features,
      pricing: landingPageData.pricing,
      testimonials: landingPageData.testimonials,
      faqs: landingPageData.faqs,
      code: landingPageData.code,
      updated_at: new Date().toISOString()
    };

    if (existingPage?.id) {
      recordToSave.id = existingPage.id;
    }

    const { error: upsertError } = await supabase
      .from('landing_pages')
      .upsert(recordToSave);

    if (upsertError) {
      console.error('Error saving landing page:', upsertError.message);
      return { success: false, error: upsertError.message };
    }

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true, message: 'Landing page successfully committed to database!' };
  } catch (err: any) {
    console.error('Save landing page failed:', err);
    return { success: false, error: err.message || 'Failed to save landing page.' };
  }
}

/**
 * Retrieve Workspace Timeline Events
 */
export async function getWorkspaceTimeline(workspaceId: string, filterType?: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  if (isDemoMode) {
    const mockEvents = [
      { id: '1', workspace_id: workspaceId, event_type: 'creation', title: 'Workspace Created', description: 'Venture initialized under ideation stage.', created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString() },
      { id: '2', workspace_id: workspaceId, event_type: 'report', title: 'Validation Report Generated', description: 'AI agents completed market validation with feasibility score of 85%.', created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString() },
      { id: '3', workspace_id: workspaceId, event_type: 'branding', title: 'Brand Palette Configured', description: 'Updated brand colors to Forest Green (#10B981) and Royal Indigo.', created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
      { id: '4', workspace_id: workspaceId, event_type: 'document', title: 'Competitor Specs Uploaded', description: 'Indexed file "pricing-breakdown.pdf" in the knowledge base.', created_at: new Date(Date.now() - 3600000 * 6).toISOString() },
      { id: '5', workspace_id: workspaceId, event_type: 'chat', title: 'Strategy Advisor Session', description: 'Polled assistant regarding competitor market entry thresholds.', created_at: new Date(Date.now() - 3600000 * 2).toISOString() }
    ];
    if (filterType && filterType !== 'all') {
      return { success: true, data: mockEvents.filter(e => e.event_type === filterType) };
    }
    return { success: true, data: mockEvents };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized access.' };

    // Verify collaborator role (minimum: viewer)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'viewer'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    let query = supabase
      .from('workspace_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (filterType && filterType !== 'all') {
      query = query.eq('event_type', filterType);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('Failed to get workspace timeline:', err);
    return { success: false, error: err.message || 'Failed to fetch timeline events.' };
  }
}

/**
 * Calculate Venture Health Readiness Score
 */
export async function getWorkspaceHealthScore(workspaceId: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  if (isDemoMode) {
    return {
      success: true,
      data: {
        overall: 78,
        validation: 100,
        branding: 80,
        marketing: 60,
        financial: 80,
        knowledge: 75,
        recommendations: [
          "Deploy your generated landing page to college student focus groups to collect live pre-orders.",
          "Refine Month 3-6 marketing content calendars to target Gen-Z Instagram networks.",
          "Identify secondary printing cooperative suppliers in Chennai to mitigate Tiruppur supplier risks."
        ]
      }
    };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized access.' };

    // Verify collaborator role (minimum: viewer)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'viewer'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return { success: false, error: 'Workspace not found.' };
    }

    // Query databases for readiness weights
    const [
      { data: report },
      { data: branding },
      { data: finance },
      { data: marketing },
      { count: docsCount }
    ] = await Promise.all([
      supabase.from('startup_reports').select('id, feasibility_score').eq('workspace_id', workspaceId).maybeSingle(),
      supabase.from('branding_assets').select('*').eq('workspace_id', workspaceId).maybeSingle(),
      supabase.from('financial_projections').select('*').eq('workspace_id', workspaceId).maybeSingle(),
      supabase.from('marketing_plans').select('*').eq('workspace_id', workspaceId).maybeSingle(),
      supabase.from('documents').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId)
    ]);

    // 1. Validation Score (feasibility_score or 0)
    const validation = report ? (report.feasibility_score || 80) : 0;

    // 2. Branding Score (completion percentage of name, tagline, voice, colors, logo prompts)
    let brandingVal = 0;
    if (branding) {
      if (branding.brand_name || branding.brand_names) brandingVal += 20;
      if (branding.tagline || branding.slogans) brandingVal += 20;
      if (branding.brand_voice || branding.positioning_statement) brandingVal += 20;
      if (branding.color_palette) brandingVal += 20;
      if (branding.logo_prompt || branding.logo_prompts) brandingVal += 20;
    }

    // 3. Marketing Score (completion of social posts, email copies, ads campaigns, and content calendars)
    let marketingVal = 0;
    if (marketing) {
      if (marketing.instagram_campaigns && marketing.instagram_campaigns.length > 0) marketingVal += 25;
      if (marketing.email_sequences && marketing.email_sequences.length > 0) marketingVal += 25;
      if (marketing.ad_copy) marketingVal += 25;
      if (marketing.content_calendar && marketing.content_calendar.length > 0) marketingVal += 25;
    }

    // 4. Financial Score (completion of startup costs, projections cash flows, and break-even overheads)
    let financialVal = 0;
    if (finance) {
      if (finance.startup_costs && finance.startup_costs.length > 0) financialVal += 33.3;
      if (finance.revenue_projections && finance.revenue_projections.length > 0) financialVal += 33.3;
      if (finance.break_even_analysis) financialVal += 33.4;
    }
    financialVal = Math.round(financialVal);

    // 5. Knowledge Completeness Score (Math.min(100, documents_count * 25))
    const knowledgeVal = Math.min(100, (docsCount || 0) * 25);

    // Average overall score
    const overall = Math.round((validation + brandingVal + marketingVal + financialVal + knowledgeVal) / 5);

    let recommendations: string[] | null = null;
    let recommendationsDegraded = false;
    let circuitBreakerActive = false;
    const recsStartTime = performance.now();

    try {
      const { getGenerativeModel } = require('@/lib/gemini');
      const model = getGenerativeModel('gemini-1.5-flash');
      const prompt = `
        You are the Co-founder Strategy Advisor for StartupOS AI. Generate exactly 3 highly specific, actionable recommendations (one line each, max 15 words per bullet) to improve the readiness of this startup:
        - Name: ${workspace.name}
        - Industry: ${workspace.industry}
        - Description: ${workspace.description}
        
        Readiness metrics:
        - Feasibility validation: ${validation}%
        - Brand identity: ${brandingVal}%
        - Financial projections: ${financialVal}%
        - Knowledge completeness: ${knowledgeVal}%
        - Marketing campaigns: ${marketingVal}%
        
        Output exclusively a valid JSON string containing an array of 3 recommendations.
        Example response format:
        [
          "Rec 1",
          "Rec 2",
          "Rec 3"
        ]
      `;

      const aiResponse = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });

      const parsedRecs = JSON.parse(aiResponse.response.text());
      if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
        recommendations = parsedRecs;
      } else {
        recommendations = [
          "Run your AI Agents validation pipeline to create initial feasibility reports.",
          "Lock down your selected brand naming guidelines and positioning statements.",
          "Formulate startup expense items and structure financial assumptions."
        ];
      }
      circuitBreakerActive = !!aiResponse.circuitBreakerActive;

      await logAiGeneration(
        user.id,
        workspaceId,
        'health_recommendations',
        aiResponse.usage,
        recsStartTime,
        aiResponse.modelUsed || 'google/gemini-2.5-flash',
        'success'
      );
    } catch (aiErr: any) {
      console.warn('Fallback to standard recommendations due to LLM failure:', aiErr);
      recommendationsDegraded = true;
      recommendations = null;
      await logAiGeneration(
        user.id,
        workspaceId,
        'health_recommendations',
        { prompt_tokens: 0, completion_tokens: 0 },
        recsStartTime,
        'google/gemini-2.5-flash',
        'failed',
        aiErr.stack || aiErr.message
      );
    }

    return {
      success: true,
      data: {
        overall,
        validation,
        branding: brandingVal,
        marketing: marketingVal,
        financial: financialVal,
        knowledge: knowledgeVal,
        recommendations,
        recommendationsDegraded,
        circuitBreakerActive
      }
    };
  } catch (err: any) {
    console.error('Failed to generate health score:', err);
    return { success: false, error: err.message || 'Failed to fetch venture health score.' };
  }
}

/**
 * Grounded AI chat helper querying knowledge base documents and historical vector memories (RAG)
 */
export async function queryKnowledgeAssistant(
  workspaceId: string,
  message: string,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[]
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  if (isDemoMode) {
    return {
      success: true,
      data: `[Demo Grounding Context] In demo mode, document indexing is simulated. Ask questions about yourGen-Z target clothing demographics or print supply channels.\n\nBased on your workspace profile, I recommend sourcing Tiruppur organic cotton fabric for India-wide campus print-on-demand fulfillment.`,
      sources: ["Gen-Z Campus Merch Plan.pdf", "Suppliers Tiruppur.txt"]
    };
  }

  const startTime = performance.now();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized access.' };
    }

    // Tenancy Check: verify the user is a member of the workspace (at least a viewer)
    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'viewer'
    });

    if (roleError || !hasRole) {
      return { success: false, error: 'Unauthorized access to this workspace.' };
    }

    const limitCheck = await checkUsageLimit('generation', workspaceId);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.message };
    }

    // 1. Embed query
    const { getGenerativeModel } = require('@/lib/gemini');
    const embedModel = getGenerativeModel('text-embedding-004');
    const embedResult = await embedModel.embedContent(message);
    const embedding = embedResult.embedding.values;

    // 2. Fetch similarity matches
    const { matchWorkspaceMemories } = require('@/lib/vector-store');
    const matches = await matchWorkspaceMemories(workspaceId, embedding, 0.4, 6);

    // 3. Construct context
    const groundingContext = matches
      .map((m: any) => `Source Document: ${m.metadata?.document_name || 'Workspace memory'}\nContent chunk: ${m.content}`)
      .join('\n\n---\n\n');

    const sources = Array.from(new Set(matches.map((m: any) => m.metadata?.document_name).filter(Boolean)));

    // 4. Generate LLM Grounded Response
    const model = getGenerativeModel('gemini-1.5-flash');
    const systemPrompt = `
      You are the Knowledge Assistant for StartupOS AI. Your goal is to answer questions about the founder's startup idea, plans, and uploaded files.
      You MUST ground your answers strictly inside the provided workspace knowledge context.
      If the context does not contain sufficient details to answer, state that the context lacks sufficient information, but answer as best as possible using the workspace data. Do not make up facts.
      
      WORKSPACE KNOWLEDGE CONTEXT:
      ${groundingContext || 'No matching file uploads or custom memory vector chunks found.'}
    `;

    // Map role format matching standard OpenRouter history arrays
    const formattedHistory = chatHistory.map((ch) => ({
      role: ch.role === 'model' ? 'assistant' as const : 'user' as const,
      content: ch.parts[0]?.text || ''
    }));

    // Perform OpenRouter completions query via custom adapter getGenerativeModel
    const promptCombined = `
      System instructions: ${systemPrompt}
      
      Chat History:
      ${formattedHistory.map((h) => `${h.role === 'assistant' ? 'AI' : 'User'}: ${h.content}`).join('\n')}
      
      Current User Question:
      ${message}
    `;

    const aiResponse = await model.generateContent(promptCombined);
    const answer = aiResponse.response.text();

    // 5. Log chat to workspace events
    await supabase.from('workspace_events').insert({
      workspace_id: workspaceId,
      event_type: 'chat',
      title: 'Knowledge Query',
      description: `Queried the co-founder assistant regarding "${message.substring(0, 45)}${message.length > 45 ? '...' : ''}"`,
      metadata: { query: message, sources },
    });

    await logAiGeneration(
      user.id,
      workspaceId,
      'knowledge_assistant',
      (aiResponse as any).usage,
      startTime,
      aiResponse.modelUsed || 'google/gemini-2.5-flash',
      'success'
    );

    return {
      success: true,
      data: answer,
      sources,
      circuitBreakerActive: !!aiResponse.circuitBreakerActive
    };
  } catch (err: any) {
    const logId = `LOG-KNOWLEDGE-${Date.now()}`;
    console.error(`Knowledge query assistant failed (${logId}):`, err);
    
    // Find if we have user.id available, else fallback
    let loggedUserId = 'anonymous';
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) loggedUserId = user.id;
    } catch {}

    await logAiGeneration(
      loggedUserId,
      workspaceId,
      'knowledge_assistant',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'google/gemini-2.5-flash',
      'failed',
      err.stack || err.message
    );
    return {
      success: false,
      error: 'AI generation failed. Knowledge assistant temporarily unavailable. Please try again.',
      logId
    };
  }
}

/**
 * Invite a new team member to the workspace
 */
export async function inviteMember(
  workspaceId: string,
  email: string,
  role: 'admin' | 'editor' | 'viewer'
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    return {
      success: true,
      inviteUrl: `/invitations/mock-invite-id-123`,
      message: 'Invitation link simulated in demo mode.'
    };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized access.' };

    const limitCheck = await checkUsageLimit('collaboration', workspaceId);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.message };
    }

    const { data: hasRole } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'admin'
    });

    if (!hasRole) {
      return { success: false, error: 'Only workspace owners and admins can invite team members.' };
    }

    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id: workspaceId,
        email: email.toLowerCase().trim(),
        role,
        invited_by: user.id,
        status: 'pending'
      })
      .select('id')
      .single();

    if (inviteError || !invite) {
      throw new Error(inviteError?.message || 'Failed to create database invitation record.');
    }

    await supabase.from('workspace_events').insert({
      workspace_id: workspaceId,
      event_type: 'creation',
      title: 'Member Invited',
      description: `Invited "${email}" to join the workspace as a ${role}.`,
      user_id: user.id,
      metadata: { email, role, invite_id: invite.id }
    });

    const inviteUrl = `/invitations/${invite.id}`;
    
    // Get host from headers
    const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const cleanOrigin = origin.startsWith('http') ? origin : `https://${origin}`;
    const fullInviteUrl = `${cleanOrigin}${inviteUrl}`;

    // Send styled invitation email via Resend
    await sendEmail({
      to: email.toLowerCase().trim(),
      subject: 'You have been invited to join a StartupOS AI Workspace',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #111827;">Workspace Collaboration Invitation</h2>
          <p>Hi,</p>
          <p>You have been invited to join a StartupOS AI workspace as a <strong>${role.toUpperCase()}</strong> collaborator.</p>
          <p>Click the button below to accept the invitation and join the workspace team:</p>
          <div style="margin: 24px 0;">
            <a href="${fullInviteUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Accept & Join Workspace</a>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 40px; border-t: 1px solid #e5e7eb; padding-top: 20px;">If you do not have an account, you will be prompted to create one before joining.</p>
        </div>
      `
    }).catch(err => console.error('Failed to send invite email:', err));

    return {
      success: true,
      inviteUrl,
      message: `Invitation generated successfully. Share this link: ${inviteUrl}`
    };
  } catch (err: any) {
    console.error('Invite member error:', err);
    return { success: false, error: err.message || 'Failed to invite team member.' };
  }
}

/**
 * Revoke a pending team invitation
 */
export async function revokeInvitation(workspaceId: string, inviteId: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) return { success: true };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized access.' };

    const { data: hasRole } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'admin'
    });
    if (!hasRole) return { success: false, error: 'Unauthorized role permissions.' };

    const { error } = await supabase
      .from('workspace_invitations')
      .update({ status: 'revoked' })
      .eq('id', inviteId)
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    await supabase.from('workspace_events').insert({
      workspace_id: workspaceId,
      event_type: 'creation',
      title: 'Invitation Revoked',
      description: `Revoked a pending team invitation.`,
      user_id: user.id
    });

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Revoke invitation error:', err);
    return { success: false, error: err.message || 'Failed to revoke invitation.' };
  }
}

/**
 * Accept a pending team invitation and add member to workspace
 */
export async function acceptInvitation(inviteId: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) return { success: true, workspaceId: 'demo-workspace-1' };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'You must be logged in to accept invitations.' };

    const { data: invite, error: fetchError } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('id', inviteId)
      .single();

    if (fetchError || !invite) {
      return { success: false, error: 'Invitation not found.' };
    }

    if (invite.status !== 'pending') {
      return { success: false, error: `This invitation has already been ${invite.status}.` };
    }

    if (new Date(invite.expires_at) < new Date()) {
      return { success: false, error: 'This invitation has expired.' };
    }

    if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return { success: false, error: `This invitation was sent to ${invite.email}, but you are logged in as ${user.email}.` };
    }

    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role
      });

    if (memberError && memberError.code !== '23505') {
      throw memberError;
    }

    await supabase
      .from('workspace_invitations')
      .update({ status: 'accepted' })
      .eq('id', inviteId);

    await supabase.from('workspace_events').insert({
      workspace_id: invite.workspace_id,
      event_type: 'creation',
      title: 'Member Joined',
      description: `Collaborator "${user.email}" accepted their invitation and joined the workspace.`,
      user_id: user.id,
      metadata: { user_id: user.id, role: invite.role }
    });

    revalidatePath(`/workspaces/${invite.workspace_id}`);
    return { success: true, workspaceId: invite.workspace_id };
  } catch (err: any) {
    console.error('Accept invitation error:', err);
    return { success: false, error: err.message || 'Failed to accept invitation.' };
  }
}

/**
 * Add a comment on a workspace resource
 */
export async function addComment(
  workspaceId: string,
  resourceType: 'report' | 'branding' | 'finance' | 'roadmap' | 'marketing' | 'pitchdeck' | 'landingpage',
  content: string
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    return {
      success: true,
      data: {
        id: 'mock-comment-id',
        workspace_id: workspaceId,
        user_id: 'mock-user-id',
        resource_type: resourceType,
        content,
        created_at: new Date().toISOString(),
        profiles: { email: 'demo-founder@startupos.ai', full_name: 'Demo Founder' }
      }
    };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized access.' };

    const limitCheck = await checkUsageLimit('collaboration', workspaceId);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.message };
    }

    const { data: hasRole } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'viewer'
    });
    if (!hasRole) return { success: false, error: 'Unauthorized role permissions.' };

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        resource_type: resourceType,
        content
      })
      .select('*, profiles(email, full_name)')
      .single();

    if (error) throw error;

    await supabase.from('workspace_events').insert({
      workspace_id: workspaceId,
      event_type: 'chat',
      title: 'Comment Added',
      description: `Commented on workspace ${resourceType}: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
      user_id: user.id,
      metadata: { resource_type: resourceType }
    });

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true, data: comment };
  } catch (err: any) {
    console.error('Add comment error:', err);
    return { success: false, error: err.message || 'Failed to add comment.' };
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string, workspaceId: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) return { success: true };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized access.' };

    const { data: comment, error: fetchErr } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchErr || !comment) return { success: false, error: 'Comment not found.' };

    const { data: isAdmin } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'admin'
    });

    if (comment.user_id !== user.id && !isAdmin) {
      return { success: false, error: 'You do not have permission to delete this comment.' };
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Delete comment error:', err);
    return { success: false, error: err.message || 'Failed to delete comment.' };
  }
}

/**
 * Save a snapshot version of a workspace module
 */
export async function createVersion(
  workspaceId: string,
  type: 'branding' | 'marketing' | 'finance',
  label: string
) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    return {
      success: true,
      message: 'Version snapshot simulated in demo mode.'
    };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized access.' };

    const limitCheck = await checkUsageLimit('collaboration', workspaceId);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.message };
    }

    const { data: hasRole } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });
    if (!hasRole) return { success: false, error: 'Only editors and admins can checkpoint versions.' };

    let table = '';
    if (type === 'branding') table = 'branding_assets';
    else if (type === 'marketing') table = 'marketing_plans';
    else if (type === 'finance') table = 'financial_projections';

    const { data: moduleData, error: loadErr } = await supabase
      .from(table)
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (loadErr) throw loadErr;
    if (!moduleData) {
      return { success: false, error: `No active ${type} profiles exist in this workspace to checkpoint.` };
    }

    const { data: lastVersion } = await supabase
      .from('workspace_versions')
      .select('version_number')
      .eq('workspace_id', workspaceId)
      .eq('version_type', type)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const versionNumber = (lastVersion?.version_number || 0) + 1;

    const { error: insertErr } = await supabase
      .from('workspace_versions')
      .insert({
        workspace_id: workspaceId,
        created_by: user.id,
        version_type: type,
        data: moduleData,
        version_number: versionNumber,
        label
      });

    if (insertErr) throw insertErr;

    await supabase.from('workspace_events').insert({
      workspace_id: workspaceId,
      event_type: type === 'branding' ? 'branding' : type === 'marketing' ? 'marketing' : 'finance',
      title: 'Version Saved',
      description: `Created version #${versionNumber} snapshot for ${type} module: "${label}"`,
      user_id: user.id,
      metadata: { version: versionNumber }
    });

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true, message: `Version #${versionNumber} successfully created.` };
  } catch (err: any) {
    console.error('Create version error:', err);
    return { success: false, error: err.message || 'Failed to create version snapshot.' };
  }
}

/**
 * Rollback a workspace module to a previous snapshot
 */
export async function rollbackToVersion(versionId: string, workspaceId: string) {
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
  if (isDemoMode) return { success: true };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized access.' };

    const { data: hasRole } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'editor'
    });
    if (!hasRole) return { success: false, error: 'Only editors and admins can perform rollbacks.' };

    const { data: version, error: loadErr } = await supabase
      .from('workspace_versions')
      .select('*')
      .eq('id', versionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (loadErr || !version) {
      return { success: false, error: 'Version record not found.' };
    }

    const type = version.version_type;
    let table = '';
    if (type === 'branding') table = 'branding_assets';
    else if (type === 'marketing') table = 'marketing_plans';
    else if (type === 'finance') table = 'financial_projections';

    const { data: currentState } = await supabase
      .from(table)
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (currentState) {
      const { data: lastVersion } = await supabase
        .from('workspace_versions')
        .select('version_number')
        .eq('workspace_id', workspaceId)
        .eq('version_type', type)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const autoVersionNumber = (lastVersion?.version_number || 0) + 1;

      await supabase
        .from('workspace_versions')
        .insert({
          workspace_id: workspaceId,
          created_by: user.id,
          version_type: type,
          data: currentState,
          version_number: autoVersionNumber,
          label: `Auto-saved backup prior to rolling back to v#${version.version_number}`
        });
    }

    const restoredData = { ...version.data };
    delete restoredData.id;
    delete restoredData.created_at;
    restoredData.updated_at = new Date().toISOString();

    const { error: restoreErr } = await supabase
      .from(table)
      .update(restoredData)
      .eq('workspace_id', workspaceId);

    if (restoreErr) throw restoreErr;

    await supabase.from('workspace_events').insert({
      workspace_id: workspaceId,
      event_type: type === 'branding' ? 'branding' : type === 'marketing' ? 'marketing' : 'finance',
      title: 'Rollback Restored',
      description: `Restored workspace module ${type} to version #${version.version_number} snapshot.`,
      user_id: user.id,
      metadata: { rolled_back_to: version.version_number }
    });

    revalidatePath(`/workspaces/${workspaceId}`);
    return { success: true, message: `Successfully rolled back to version #${version.version_number}.` };
  } catch (err: any) {
    console.error('Rollback version error:', err);
    return { success: false, error: err.message || 'Failed to rollback version.' };
  }
}






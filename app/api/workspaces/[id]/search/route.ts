import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/db/server";
import { getGenerativeModel } from "@/lib/gemini";
import { matchWorkspaceMemories } from "@/lib/vector-store";
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
        model: modelName || 'text-embedding-004',
        status: status,
        error_message: errorMessage || null,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.warn('[Search logAiGeneration] Full insert failed, falling back to base columns:', error.message);
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

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const startTime = performance.now();
  let currentUserId = 'anonymous';
  let wsId: string | null = null;

  try {
    const { id: workspaceId } = await props.params;
    wsId = workspaceId;

    // Tenancy Check
    const { client: supabase, user } = await createClientFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    currentUserId = user.id;

    const { data: hasRole, error: roleError } = await supabase.rpc('has_workspace_role', {
      workspace_id: workspaceId,
      min_role: 'viewer'
    });

    if (roleError || !hasRole) {
      return NextResponse.json({ error: "Unauthorized access to workspace" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Embed search query
    const embedModel = getGenerativeModel("text-embedding-004");
    const embedResult = await embedModel.embedContent(query);
    const embedding = embedResult.embedding.values;

    // Retrieve similarity matches
    const matches = await matchWorkspaceMemories(workspaceId, embedding, 0.4, 15);

    await logAiGeneration(
      currentUserId,
      wsId,
      'document_search',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'text-embedding-004',
      'success'
    );

    return NextResponse.json({ success: true, data: matches });
  } catch (err: any) {
    const logId = `LOG-SEARCH-${Date.now()}`;
    console.error(`[Search API GET] Exception (${logId}):`, err);
    await logAiGeneration(
      currentUserId,
      wsId,
      'document_search',
      { prompt_tokens: 0, completion_tokens: 0 },
      startTime,
      'text-embedding-004',
      'failed',
      err.stack || err.message
    );
    return NextResponse.json({ 
      success: false, 
      error: "Search service is temporarily degraded. Vector database query or embedding generation failed.",
      data: [],
      logId
    }, { status: 500 });
  }
}

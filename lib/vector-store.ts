import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Perform a cosine similarity match search on vector memories for a specific workspace.
 */
export async function matchWorkspaceMemories(
  workspaceId: string,
  embedding: number[],
  matchThreshold = 0.70,
  matchCount = 5
) {
  const { data, error } = await supabaseAdmin.rpc('match_workspace_memories', {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    target_workspace_id: workspaceId,
  });

  if (error) {
    console.error('Error invoking match_workspace_memories RPC:', error.message);
    throw error;
  }

  return data || [];
}

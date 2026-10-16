import { createClient } from '@/utils/supabase/server';
import { createClient as createBrowserClient } from '@/utils/supabase/client';
import type { Score } from '@/lib/supabase/types';

export async function getScoresByGame(gameId: string, limit = 12): Promise<Score[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Score[];
}

export async function getGlobalRanking(
  limit = 10,
): Promise<{ player_name: string; total_score: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_global_ranking', { lim: limit });
  if (error) {
    // Fallback: manual query if RPC not available
    const { data: scores, error: fallbackError } = await supabase
      .from('scores')
      .select('player_name, game_id, score');
    if (fallbackError) throw fallbackError;

    const bestByPlayerGame = new Map<string, number>();
    for (const s of scores!) {
      const key = `${s.player_name}::${s.game_id}`;
      bestByPlayerGame.set(key, Math.max(bestByPlayerGame.get(key) ?? 0, s.score));
    }

    const totals = new Map<string, number>();
    for (const [key, best] of bestByPlayerGame) {
      const player = key.split('::')[0];
      totals.set(player, (totals.get(player) ?? 0) + best);
    }

    return [...totals.entries()]
      .map(([player_name, total_score]) => ({ player_name, total_score }))
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, limit);
  }
  return data;
}

export async function getRecentScores(limit = 10): Promise<Score[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Score[];
}

export async function submitScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<Score> {
  const supabase = createBrowserClient();
  const normalizedName = playerName.trim().toUpperCase();
  const { data, error } = await supabase
    .from('scores')
    .insert({ game_id: gameId, player_name: normalizedName, score })
    .select()
    .single();
  if (error) throw error;
  return data as Score;
}

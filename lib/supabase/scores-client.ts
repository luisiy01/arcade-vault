import { createClient } from '@/utils/supabase/client';
import type { Score } from '@/lib/supabase/types';

export async function submitScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<Score> {
  const supabase = createClient();
  const normalizedName = playerName.trim().toUpperCase();
  const { data, error } = await supabase
    .from('scores')
    .insert({ game_id: gameId, player_name: normalizedName, score })
    .select()
    .single();
  if (error) throw error;
  return data as Score;
}

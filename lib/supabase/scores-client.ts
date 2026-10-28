import { createClient } from '@/utils/supabase/client';
import type { Score } from '@/lib/supabase/types';

export async function submitScore(gameId: string, score: number): Promise<Score | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const playerName = profile?.display_name ?? 'PLAYER';

  const { data, error } = await supabase
    .from('scores')
    .insert({
      game_id: gameId,
      player_name: playerName,
      score,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Score;
}

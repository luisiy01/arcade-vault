import { getGames } from '@/lib/supabase/games';
import { getRecentScores, getGlobalRanking } from '@/lib/supabase/scores';
import { HomeClient } from './home-client';

export default async function HomePage() {
  const [games, recentScores, topPlayers] = await Promise.all([
    getGames(),
    getRecentScores(7),
    getGlobalRanking(5),
  ]);

  return <HomeClient games={games} recentScores={recentScores} topPlayers={topPlayers} />;
}

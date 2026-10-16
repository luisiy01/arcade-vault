import { getGames } from '@/lib/supabase/games';
import { getScoresByGame } from '@/lib/supabase/scores';
import { HallClient } from './hall-client';

export default async function HallOfFamePage() {
  const games = await getGames();

  const scoresByGame: Record<string, Awaited<ReturnType<typeof getScoresByGame>>> = {};
  await Promise.all(
    games.map(async (g) => {
      scoresByGame[g.id] = await getScoresByGame(g.id, 12);
    }),
  );

  return <HallClient games={games} scoresByGame={scoresByGame} />;
}

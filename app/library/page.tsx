import { getGames } from '@/lib/supabase/games';
import { LibraryClient } from './library-client';

export default async function LibraryPage() {
  const games = await getGames();

  return <LibraryClient games={games} />;
}

import { notFound } from 'next/navigation';
import { getGameSlugs, getGameById } from '@/lib/supabase/games';
import { PlayScreen } from '@/components/play-screen';

export async function generateStaticParams() {
  const slugs = await getGameSlugs();
  return slugs.map((g) => ({ id: g.id }));
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) notFound();

  return <PlayScreen game={{ id: game.id, title: game.title }} />;
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import type { Game } from '@/lib/supabase/types';

function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

export async function getGameSlugs(): Promise<{ id: string }[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from('games').select('id');
  if (error) throw error;
  return data as { id: string }[];
}

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('games').select('*').order('title');
  if (error) throw error;
  return data as Game[];
}

export async function getGameById(id: string): Promise<Game | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('games').select('*').eq('id', id).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as Game;
}

export async function getGamesByCategory(cat: string): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('games').select('*').eq('cat', cat).order('title');
  if (error) throw error;
  return data as Game[];
}

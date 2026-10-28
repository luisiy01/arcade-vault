'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Provider, SupabaseClient } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

interface SignUpResult {
  error: string | null;
  needsConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<SignUpResult>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithOAuth: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchDisplayName(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('display_name').eq('id', userId).single();
  return data?.display_name ?? 'PLAYER';
}

function resolveDisplayName(supabaseUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  return (
    (supabaseUser.user_metadata?.display_name as string) ??
    (supabaseUser.user_metadata?.full_name as string) ??
    (supabaseUser.user_metadata?.user_name as string) ??
    supabaseUser.email?.split('@')[0] ??
    'PLAYER'
  )
    .toUpperCase()
    .slice(0, 10);
}

function toUser(supabaseUser: { id: string; email?: string | null }, displayName: string): User {
  return { id: supabaseUser.id, email: supabaseUser.email ?? '', displayName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        let displayName: string;
        try {
          displayName = await fetchDisplayName(supabase, session.user.id);
        } catch {
          displayName = resolveDisplayName(session.user);
        }
        setUser(toUser(session.user, displayName));
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        let displayName: string;
        try {
          displayName = await fetchDisplayName(supabase, session.user.id);
        } catch {
          displayName = resolveDisplayName(session.user);
        }
        setUser(toUser(session.user, displayName));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const formatted = displayName.toUpperCase().slice(0, 10);

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('display_name', formatted)
        .single();

      if (existing) {
        return { error: 'Ese nombre ya está en uso.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: formatted } },
      });
      if (error) return { error: error.message };
      if (!data.session) return { error: null, needsConfirmation: true };
      return { error: null };
    },
    [supabase],
  );

  const signInWithOAuth = useCallback(
    async (provider: Provider) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      return { error: error?.message ?? null };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      return { error: error?.message ?? null };
    },
    [supabase],
  );

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signInWithOAuth, signOut, resetPassword }),
    [user, loading, signIn, signUp, signInWithOAuth, signOut, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

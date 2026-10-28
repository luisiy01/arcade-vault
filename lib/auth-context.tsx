'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Provider } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error: string | null }>;
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

const supabase = createClient();

async function fetchDisplayName(userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('display_name').eq('id', userId).single();
  return data?.display_name ?? 'PLAYER';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const displayName = await fetchDisplayName(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          displayName,
        });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const displayName = await fetchDisplayName(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          displayName,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const formatted = displayName.toUpperCase().slice(0, 10);

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('display_name', formatted)
      .single();

    if (existing) {
      return { error: 'Ese nombre ya está en uso.' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: formatted } },
    });
    return { error: error?.message ?? null };
  }, []);

  const signInWithOAuth = useCallback(async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    return { error: error?.message ?? null };
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signInWithOAuth, signOut, resetPassword }),
    [user, loading, signIn, signUp, signInWithOAuth, signOut, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createLocalRepository } from "./localRepository";
import type { Repository } from "./repository";
import { supabase } from "./supabaseClient";
import { createSupabaseRepository } from "./supabaseRepository";
import { migrateLocalTeam } from "./teamTransfer";

type DataContextValue = {
  /** False when the build has no backend configured. */
  authEnabled: boolean;
  user: User | null;
  /** True until the session is restored and any pending migration finished. */
  loading: boolean;
  repository: Repository;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;
};

const localRepository = createLocalRepository();

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;

    const apply = async (next: User | null) => {
      if (next) {
        setLoading(true);
        try {
          await migrateLocalTeam(createSupabaseRepository(client), next.id);
        } catch (error) {
          console.error("Failed to migrate local data", error);
        }
      }
      if (!active) return;
      setUser(next);
      setLoading(false);
    };

    client.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        void apply(session?.user ?? null);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<DataContextValue>(() => {
    const client = supabase;
    return {
      authEnabled: !!client,
      user,
      loading,
      repository: client && user ? createSupabaseRepository(client) : localRepository,
      async signIn(email, password) {
        if (!client) return;
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      },
      async signUp(email, password) {
        if (!client) return { needsConfirmation: false };
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
        });
        if (error) throw new Error(error.message);
        return { needsConfirmation: !data.session };
      },
      async signOut() {
        await client?.auth.signOut();
      },
    };
  }, [user, loading]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

const fallback: DataContextValue = {
  authEnabled: false,
  user: null,
  loading: false,
  repository: localRepository,
  signIn: async () => {},
  signUp: async () => ({ needsConfirmation: false }),
  signOut: async () => {},
};

/** Works without a provider (tests, local-only) by falling back to device storage. */
export function useData(): DataContextValue {
  return useContext(DataContext) ?? fallback;
}

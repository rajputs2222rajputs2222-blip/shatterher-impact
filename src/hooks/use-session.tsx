import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MemberProfile = {
  id: string;
  user_id: string | null;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role_title: string | null;
  team_id: string | null;
  status: "active" | "inactive" | "pending";
  total_points: number;
  total_contributions: number;
};

type SessionContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: MemberProfile | null;
  profileLoading: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  const profileQuery = useQuery({
    queryKey: ["my-profile", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<MemberProfile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as MemberProfile;

      const meta = session?.user.user_metadata ?? {};
      const fallbackName =
        (meta["full_name"] as string | undefined) ??
        (meta["name"] as string | undefined) ??
        session?.user.email?.split("@")[0] ??
        "New member";
      const { data: created, error: createError } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          full_name: fallbackName,
          avatar_url: (meta["avatar_url"] as string | undefined) ?? null,
        })
        .select("*")
        .single();
      if (createError) throw createError;
      return created as MemberProfile;
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["my-roles", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return data.map((r) => r.role as string);
    },
  });

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      profile: profileQuery.data ?? null,
      profileLoading: profileQuery.isLoading,
      isStaff: (rolesQuery.data ?? []).some((r) => r === "admin" || r === "reviewer"),
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
      },
    }),
    [session, loading, profileQuery.data, profileQuery.isLoading, rolesQuery.data, queryClient],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
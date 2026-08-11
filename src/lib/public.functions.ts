import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export type LeaderboardRow = {
  rank: number;
  profile_id: string;
  full_name: string;
  avatar_url: string | null;
  role_title: string | null;
  team_name: string | null;
  team_slug: string | null;
  points: number;
  contributions: number;
};

export const getPlatformStats = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().rpc("get_platform_stats");
  if (error) throw new Error(error.message);
  const row = data?.[0];
  return {
    members: Number(row?.members ?? 0),
    contributions: Number(row?.contributions ?? 0),
    points: Number(row?.points ?? 0),
    teams: Number(row?.teams ?? 0),
  };
});

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((input: { period?: string; team?: string | null; search?: string | null; limit?: number; offset?: number }) => input)
  .handler(async ({ data }): Promise<LeaderboardRow[]> => {
    const { data: rows, error } = await publicClient().rpc("get_leaderboard", {
      p_period: data.period ?? "all",
      p_team: data.team ?? undefined,
      p_search: data.search ?? undefined,
      p_limit: data.limit ?? 50,
      p_offset: data.offset ?? 0,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((row) => ({
      rank: Number(row.rank),
      profile_id: row.profile_id as string,
      full_name: row.full_name as string,
      avatar_url: row.avatar_url as string | null,
      role_title: row.role_title as string | null,
      team_name: row.team_name as string | null,
      team_slug: row.team_slug as string | null,
      points: Number(row.points),
      contributions: Number(row.contributions),
    }));
  });

export const getTeams = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("teams")
    .select("id, slug, name, description, icon, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getPointRules = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [teams, rules] = await Promise.all([
    supabase.from("teams").select("id, slug, name, description, icon, sort_order").order("sort_order"),
    supabase
      .from("task_types")
      .select("id, team_id, name, description, unit_label, points_per_unit, sort_order")
      .eq("active", true)
      .order("sort_order"),
  ]);
  if (teams.error) throw new Error(teams.error.message);
  if (rules.error) throw new Error(rules.error.message);
  return (teams.data ?? []).map((team) => ({
    ...team,
    rules: (rules.data ?? []).filter((rule) => rule.team_id === team.id),
  }));
});

export const getMemberProfile = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio, role_title, status, total_points, total_contributions, created_at, teams(name, slug, icon)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) return null;

    const [ledger, board, achievements] = await Promise.all([
      supabase
        .from("points_ledger")
        .select("id, points, reason, created_at")
        .eq("profile_id", data.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.rpc("get_leaderboard", { p_period: "all", p_limit: 1000, p_offset: 0 }),
      supabase
        .from("user_achievements")
        .select("earned_at, achievements(code, name, description, icon)")
        .eq("profile_id", data.id),
    ]);

    const rank = (board.data ?? []).find((row) => row.profile_id === data.id)?.rank ?? null;

    return {
      profile,
      rank: rank === null ? null : Number(rank),
      ledger: ledger.data ?? [],
      achievements: achievements.data ?? [],
    };
  });
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/shatter/admin-shell";
import { StatCard } from "@/components/shatter/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — ShatterHerLeaders" },
      { name: "description", content: "Visitors, contributions and platform activity for ShatterHerLeaders admins." },
      { property: "og:title", content: "Admin overview — ShatterHerLeaders" },
      { property: "og:description", content: "Visitors, contributions and platform activity." },
    ],
  }),
  component: AdminOverview,
});

type VisitorStats = {
  total_views: number;
  unique_visitors: number;
  views_today: number;
  daily: { day: string; views: number; visitors: number }[];
  top_pages: { path: string; views: number }[];
  referrers: { referrer: string; views: number }[];
};

function AdminOverview() {
  const visitors = useQuery({
    queryKey: ["admin-visitors"],
    queryFn: async (): Promise<VisitorStats> => {
      const { data, error } = await supabase.rpc("get_visitor_stats", { p_days: 30 });
      if (error) throw error;
      return data as unknown as VisitorStats;
    },
  });

  const platform = useQuery({
    queryKey: ["admin-platform"],
    queryFn: async () => {
      const [members, pending, submissions, approved, points, teams] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("submissions").select("id", { count: "exact", head: true }),
        supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("points_ledger").select("points"),
        supabase.from("teams").select("id", { count: "exact", head: true }),
      ]);
      return {
        members: members.count ?? 0,
        pending: pending.count ?? 0,
        submissions: submissions.count ?? 0,
        approved: approved.count ?? 0,
        points: (points.data ?? []).reduce((sum, row) => sum + (row.points ?? 0), 0),
        teams: teams.count ?? 0,
      };
    },
  });

  const daily = visitors.data?.daily ?? [];
  const peak = Math.max(1, ...daily.map((d) => Number(d.views)));

  return (
    <AdminShell title="Overview" description="Live traffic and platform activity. Nothing here is simulated.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Views (30d)" value={formatNumber(Number(visitors.data?.total_views ?? 0))} />
        <StatCard label="Unique visitors" value={formatNumber(Number(visitors.data?.unique_visitors ?? 0))} accent />
        <StatCard label="Views today" value={formatNumber(Number(visitors.data?.views_today ?? 0))} />
        <StatCard label="Members" value={formatNumber(platform.data?.members ?? 0)} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pending approvals" value={formatNumber(platform.data?.pending ?? 0)} />
        <StatCard label="Submissions" value={formatNumber(platform.data?.submissions ?? 0)} />
        <StatCard label="Approved" value={formatNumber(platform.data?.approved ?? 0)} />
        <StatCard label="Points awarded" value={formatNumber(platform.data?.points ?? 0)} accent />
      </div>

      <section className="liquid bulge mt-8 p-5 sm:p-6">
        <h2 className="text-xl">Daily traffic</h2>
        {visitors.isLoading ? (
          <div className="grid h-40 place-items-center"><Loader2 className="size-5 animate-spin text-primary" /></div>
        ) : daily.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No visits recorded yet.</p>
        ) : (
          <div className="mt-6 flex h-40 items-end gap-1">
            {daily.map((d) => (
              <div key={d.day} className="group flex flex-1 flex-col items-center justify-end gap-2" title={`${d.day}: ${d.views} views`}>
                <div
                  className="w-full rounded-t-md bg-primary/70 transition-all group-hover:bg-primary"
                  style={{ height: `${(Number(d.views) / peak) * 100}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="liquid bulge p-5 sm:p-6">
          <h2 className="text-xl">Top pages</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(visitors.data?.top_pages ?? []).map((p) => (
              <li key={p.path} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/30 px-3 py-2">
                <span className="truncate text-muted-foreground">{p.path}</span>
                <span className="tabular-nums">{formatNumber(Number(p.views))}</span>
              </li>
            ))}
            {(visitors.data?.top_pages ?? []).length === 0 ? (
              <li className="text-muted-foreground">No page views yet.</li>
            ) : null}
          </ul>
        </section>
        <section className="liquid bulge p-5 sm:p-6">
          <h2 className="text-xl">Referrers</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(visitors.data?.referrers ?? []).map((r) => (
              <li key={r.referrer} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/30 px-3 py-2">
                <span className="truncate text-muted-foreground">{r.referrer}</span>
                <span className="tabular-nums">{formatNumber(Number(r.views))}</span>
              </li>
            ))}
            {(visitors.data?.referrers ?? []).length === 0 ? (
              <li className="text-muted-foreground">No referrers yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberShell } from "@/components/shatter/member-nav";
import { Eyebrow, StatCard, StatusBadge } from "@/components/shatter/ui-bits";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { profile, user } = useSession();

  const recent = useQuery({
    queryKey: ["my-submissions", "recent", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, title, status, quantity, awarded_points, submitted_at, task_types(name)")
        .order("submitted_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const rankQuery = useQuery({
    queryKey: ["my-rank", profile?.id],
    enabled: Boolean(profile),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", { p_period: "all", p_limit: 1000, p_offset: 0 });
      if (error) throw error;
      const rows = data ?? [];
      const me = rows.find((r) => r.profile_id === profile!.id);
      const next = me ? rows.find((r) => Number(r.rank) === Number(me.rank) - 1) : null;
      return { rank: me ? Number(me.rank) : null, nextPoints: next ? Number(next.points) : null };
    },
  });

  const points = profile?.total_points ?? 0;
  const nextPoints = rankQuery.data?.nextPoints ?? null;
  const progress = nextPoints && nextPoints > 0 ? Math.min(100, Math.round((points / nextPoints) * 100)) : 100;

  return (
    <MemberShell>
      <div className="animate-rise">
        <Eyebrow><Sparkles className="size-3" /> Member area</Eyebrow>
        <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
          Welcome back, <span className="italic text-primary">{profile?.full_name?.split(" ")[0] ?? "leader"}</span>.
        </h1>
        {profile?.status === "pending" ? (
          <div className="liquid animate-pop mt-5 border-accent/40 p-4 text-sm">
            Your membership is <span className="text-accent">pending approval</span>. You can browse everything — contributions unlock once an admin activates you.
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total points" value={points} animate accent />
        <StatCard label="Rank" value={rankQuery.data?.rank ? `#${rankQuery.data.rank}` : "—"} />
        <StatCard label="Contributions" value={profile?.total_contributions ?? 0} animate />
        <StatCard label="Pending review" value={(recent.data ?? []).filter((s) => s.status === "pending").length} />
      </div>

      <div className="liquid liquid-hover animate-pop mt-6 p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl">What did you contribute today?</h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Share your work — writing, design, research, podcasting, partnerships. Every approved contribution earns points.
        </p>
        <Button asChild size="lg" className="tap mt-5">
          <Link to="/contribute"><Plus className="size-4" /> Share Your Contribution</Link>
        </Button>
      </div>

      <div className="liquid animate-pop mt-6 p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress to next rank</span>
          <span className="tabular-nums">{nextPoints ? `${formatNumber(points)} / ${formatNumber(nextPoints)}` : "You're #1"}</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Recent contributions</h2>
          <Link to="/my-contributions" className="tap inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {(recent.data ?? []).map((s, i) => (
            <div key={s.id} style={{ animationDelay: `${i * 50}ms` }} className="liquid liquid-hover animate-pop flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {(s.task_types as { name: string } | null)?.name} · {formatDate(s.submitted_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {s.awarded_points ? <span className="text-sm font-semibold tabular-nums text-primary">+{s.awarded_points}</span> : null}
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))}
          {recent.data && recent.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet — your first contribution is waiting.</p>
          ) : null}
        </div>
      </section>
    </MemberShell>
  );
}

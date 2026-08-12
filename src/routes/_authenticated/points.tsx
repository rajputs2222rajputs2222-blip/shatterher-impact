import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { MemberShell } from "@/components/shatter/member-nav";
import { EmptyState, StatCard } from "@/components/shatter/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatDate, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/points")({
  component: PointsHistory,
});

function PointsHistory() {
  const { profile } = useSession();
  const query = useQuery({
    queryKey: ["my-ledger", profile?.id],
    enabled: Boolean(profile),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_ledger")
        .select("id, points, reason, created_at")
        .eq("profile_id", profile!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const entries = [...(query.data ?? [])].reverse();
  let running = query.data?.reduce((sum, e) => sum + e.points, 0) ?? 0;

  return (
    <MemberShell>
      <h1 className="text-4xl leading-tight animate-rise sm:text-5xl">Points history</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total points" value={profile?.total_points ?? 0} animate accent />
        <StatCard label="Ledger entries" value={entries.length} />
        <StatCard label="Contributions" value={profile?.total_contributions ?? 0} />
      </div>

      {entries.length === 0 && !query.isLoading ? (
        <div className="mt-8"><EmptyState title="No points yet" description="Approved contributions add entries here." /></div>
      ) : null}

      <ol className="mt-8 space-y-2">
        {entries.map((entry, i) => {
          const total = running;
          running -= entry.points;
          return (
            <li key={entry.id} style={{ animationDelay: `${i * 40}ms` }} className="liquid animate-pop flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm">{entry.reason}</p>
                <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-primary">
                  <Trophy className="size-3.5" /> {entry.points > 0 ? "+" : ""}{formatNumber(entry.points)}
                </p>
                <p className="text-[11px] text-muted-foreground">running {formatNumber(total)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </MemberShell>
  );
}

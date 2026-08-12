import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, Search, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type LeaderboardRow, type TeamRow, getLeaderboard, getTeams, type LeaderboardRow } from "@/lib/public.functions";
import { formatNumber, initials } from "@/lib/format";
import { Eyebrow, EmptyState } from "@/components/shatter/ui-bits";
import { cn } from "@/lib/utils";

const periods = [
  { key: "all", label: "Overall" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
] as const;

const PAGE = 25;

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — ShatterHerLeaders" },
      { name: "description", content: "See who is leading the ShatterHer movement. Ranked by verified contributions and points earned." },
      { property: "og:title", content: "Leaderboard — ShatterHerLeaders" },
      { property: "og:description", content: "See who is leading the ShatterHer movement this week, this month and overall." },
    ],
  }),
  loader: async () => ({
    initial: await getLeaderboard({ data: { period: "all", limit: PAGE, offset: 0 } }),
    teams: await getTeams(),
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { initial, teams } = Route.useLoaderData() as { initial: LeaderboardRow[]; teams: TeamRow[] };
  const [period, setPeriod] = useState<string>("all");
  const [team, setTeam] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const isDefault = period === "all" && !team && !search && page === 0;

  const query = useQuery({
    queryKey: ["leaderboard", period, team, search, page],
    queryFn: () => getLeaderboard({ data: { period, team, search: search || null, limit: PAGE, offset: page * PAGE } }),
    initialData: isDefault ? initial : undefined,
    placeholderData: (prev) => prev,
  });

  const rows = query.data ?? [];
  const podium = page === 0 ? rows.slice(0, 3) : [];
  const rest = page === 0 ? rows.slice(3) : rows;

  function update(fn: () => void) {
    fn();
    setPage(0);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 pb-28 sm:px-6 sm:py-16 lg:pb-16">
      <div className="animate-rise">
        <Eyebrow><Trophy className="size-3" /> Leaderboard</Eyebrow>
        <h1 className="mt-4 text-4xl leading-[1] sm:text-6xl">
          The women <span className="italic text-primary">leading</span> the way.
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Every rank here was earned through verified contributions. Filter by period, team or search for a member.
        </p>
      </div>

      <div className="liquid mt-8 flex flex-col gap-4 p-4 animate-pop sm:p-5">
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => update(() => setPeriod(p.key))}
              className={cn(
                "tap rounded-full border px-4 py-2 text-sm",
                period === p.key
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => update(() => setTeam(null))}
            className={cn(
              "tap rounded-full border px-3 py-1.5 text-xs",
              !team ? "border-accent bg-accent/20 text-accent" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            All teams
          </button>
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update(() => setTeam(t.slug))}
              className={cn(
                "tap rounded-full border px-3 py-1.5 text-xs",
                team === t.slug ? "border-accent bg-accent/20 text-accent" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => update(() => setSearch(e.target.value))}
            placeholder="Search members"
            className="pl-9"
            aria-label="Search members"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No members yet" description="Nobody matches these filters — try another period or team." />
        </div>
      ) : null}

      {podium.length > 0 ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:items-end">
          {[podium[1], podium[0], podium[2]].filter(Boolean).map((row, i) => (
            <PodiumCard key={row!.profile_id} row={row!} delay={i * 90} />
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {rest.map((row, i) => (
          <Link
            key={row.profile_id}
            to="/members/$id"
            params={{ id: row.profile_id }}
            style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
            className="liquid liquid-hover tap animate-pop flex items-center gap-4 p-4"
          >
            <span className="w-8 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">#{row.rank}</span>
            <Avatar row={row} className="size-11" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{row.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.role_title ?? "Member"}{row.team_name ? ` · ${row.team_name}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums text-primary">{formatNumber(row.points)}</p>
              <p className="text-[11px] text-muted-foreground">{row.contributions} contributions</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="outline" className="tap" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">Page {page + 1}</span>
        <Button variant="outline" className="tap" disabled={rows.length < PAGE} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function Avatar({ row, className }: { row: LeaderboardRow; className?: string }) {
  return row.avatar_url ? (
    <img src={row.avatar_url} alt={row.full_name} className={cn("shrink-0 rounded-full object-cover", className)} loading="lazy" />
  ) : (
    <span className={cn("grid shrink-0 place-items-center rounded-full border border-border bg-secondary text-xs font-semibold", className)}>
      {initials(row.full_name)}
    </span>
  );
}

function PodiumCard({ row, delay }: { row: LeaderboardRow; delay: number }) {
  const first = row.rank === 1;
  return (
    <Link
      to="/members/$id"
      params={{ id: row.profile_id }}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "liquid liquid-hover tap animate-pop flex flex-col items-center p-6 text-center",
        first && "border-accent/50 sm:-mt-6 sm:pb-10",
      )}
    >
      <span className={cn("mb-3 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium", first ? "border-accent/50 bg-accent/15 text-accent" : "border-border text-muted-foreground")}>
        {first ? <Crown className="size-3" /> : <Medal className="size-3" />} #{row.rank}
      </span>
      <Avatar row={row} className={cn(first ? "size-24" : "size-20", first && "ring-2 ring-accent/60")} />
      <p className="mt-4 text-lg font-medium">{row.full_name}</p>
      <p className="text-xs text-muted-foreground">{row.role_title ?? "Member"}{row.team_name ? ` · ${row.team_name}` : ""}</p>
      <p className={cn("mt-4 text-3xl font-semibold tabular-nums", first ? "text-accent" : "text-primary")}>{formatNumber(row.points)}</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">points</p>
    </Link>
  );
}

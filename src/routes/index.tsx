import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading, StatCard } from "@/components/shatter/ui-bits";
import { getLeaderboard, getPlatformStats, type LeaderboardRow } from "@/lib/public.functions";
import { formatNumber, initials } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShatterHerLeaders — Every contribution counts" },
      { name: "description", content: "Create. Contribute. Lead. Track your work for ShatterHer, earn points and earn your place among the leaders." },
      { property: "og:title", content: "ShatterHerLeaders — Every contribution counts" },
      { property: "og:description", content: "Create. Contribute. Lead. Earn your place among the ShatterHer leaders." },
    ],
  }),
  loader: async () => ({
    stats: await getPlatformStats(),
    top: await getLeaderboard({ data: { limit: 5 } }),
  }),
  component: Home,
});

const steps = [
  { n: "01", t: "Create", d: "Complete meaningful work for ShatterHer." },
  { n: "02", t: "Contribute", d: "Share what you created, researched, edited, planned or reviewed." },
  { n: "03", t: "Get Recognized", d: "The team verifies your contribution." },
  { n: "04", t: "Earn Points", d: "Approved contributions earn points and move you up the leaderboard." },
];

function Home() {
  const { stats, top } = Route.useLoaderData();

  return (
    <div>
      <section className="aurora relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-rise">
            <Eyebrow>ShatterHer · Leaders</Eyebrow>
            <h1 className="mt-5 text-5xl leading-[0.95] sm:text-6xl md:text-7xl">
              Every<br />contribution<br /><span className="italic text-primary">counts.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Create. Contribute. Lead. Earn your place among the ShatterHer leaders.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/contribute"><Plus className="size-4" /> Share Your Contribution</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/leaderboard">Explore the Leaders <ArrowRight className="size-4" /></Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Members" value={stats.members} animate />
              <StatCard label="Contributions" value={stats.contributions} animate />
              <StatCard label="Points earned" value={stats.points} animate accent />
              <StatCard label="Active teams" value={stats.teams} animate />
            </div>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Live leaderboard</p>
              <Link to="/leaderboard" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <ul className="mt-4 space-y-2">
              {top.map((row: LeaderboardRow) => (
                <li key={row.profile_id}>
                  <Link
                    to="/members/$id"
                    params={{ id: row.profile_id }}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 px-3 py-3 transition-colors hover:border-primary/50"
                  >
                    <span className="w-6 text-sm tabular-nums text-muted-foreground">{String(row.rank).padStart(2, "0")}</span>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
                      {initials(row.full_name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{row.full_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{row.role_title ?? row.team_name ?? "Member"}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-primary">{formatNumber(row.points)}</span>
                  </Link>
                </li>
              ))}
              {top.length === 0 ? (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  The leaderboard is getting ready. Be the first to contribute.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="How it works"
          title={<>Create → Contribute → <span className="italic text-primary">Lead</span></>}
          description="Points are a way to recognize effort. The loop is simple and the work is what matters."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.n} className="rounded-2xl border border-border bg-card/50 p-6">
              <p className="text-display text-4xl text-primary/70">{step.n}</p>
              <p className="mt-3 text-lg">{step.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="aurora rounded-3xl border border-border p-8 text-center sm:p-14">
          <h2 className="text-3xl sm:text-5xl">Your contribution matters.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
            Every page. Every reel. Every idea. Every voice. Lead by contributing.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/contribute"><Plus className="size-4" /> Share Your Contribution</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

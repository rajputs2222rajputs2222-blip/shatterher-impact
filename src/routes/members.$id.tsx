import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Award, Trophy } from "lucide-react";
import { getMemberProfile } from "@/lib/public.functions";
import { formatDate, formatNumber, initials } from "@/lib/format";
import { Eyebrow, StatCard, EmptyState } from "@/components/shatter/ui-bits";

export const Route = createFileRoute("/members/$id")({
  loader: async ({ params }) => {
    const data = await getMemberProfile({ data: { id: params.id } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.profile.full_name ?? "Member";
    return {
      meta: [
        { title: `${name} — ShatterHerLeaders` },
        { name: "description", content: `${name} has earned ${formatNumber(loaderData?.profile.total_points ?? 0)} points across ${loaderData?.profile.total_contributions ?? 0} verified contributions for ShatterHer.` },
        { property: "og:title", content: `${name} — ShatterHerLeaders` },
        { property: "og:description", content: `See ${name}'s contributions, points and achievements at ShatterHer.` },
      ],
    };
  },
  errorComponent: () => <EmptyState title="Profile unavailable" description="We couldn't load this member right now." />,
  notFoundComponent: () => <EmptyState title="Member not found" description="This profile doesn't exist." />,
  component: MemberPage,
});

function MemberPage() {
  const { profile, rank, ledger, achievements } = Route.useLoaderData();
  const team = profile.teams as { name: string; slug: string; icon: string | null } | null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 pb-28 sm:px-6 sm:py-16 lg:pb-16">
      <Link to="/leaderboard" className="tap inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to leaderboard
      </Link>

      <div className="liquid animate-pop mt-6 flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.full_name} className="size-28 rounded-full object-cover ring-2 ring-primary/40" />
        ) : (
          <span className="grid size-28 shrink-0 place-items-center rounded-full border border-border bg-secondary text-2xl font-semibold">
            {initials(profile.full_name)}
          </span>
        )}
        <div className="min-w-0">
          <Eyebrow>{team?.name ?? "ShatterHer"}</Eyebrow>
          <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{profile.full_name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{profile.role_title ?? "Member"} · joined {formatDate(profile.created_at)}</p>
          {profile.bio ? <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">{profile.bio}</p> : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Points" value={profile.total_points} animate accent />
        <StatCard label="Contributions" value={profile.total_contributions} animate />
        <StatCard label="Rank" value={rank ? `#${rank}` : "—"} />
      </div>

      <section className="mt-10">
        <h2 className="text-2xl">Achievements</h2>
        {achievements.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No badges earned yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {achievements.map((a, i) => {
              const badge = a.achievements as { code: string; name: string; description: string; icon: string } | null;
              return (
                <div key={i} style={{ animationDelay: `${i * 60}ms` }} className="liquid liquid-hover animate-pop flex items-start gap-3 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"><Award className="size-5" /></span>
                  <div>
                    <p className="font-medium">{badge?.name}</p>
                    <p className="text-xs text-muted-foreground">{badge?.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl">Recent points</h2>
        {ledger.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No points recorded yet.</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {ledger.map((entry, i) => (
              <li key={entry.id} style={{ animationDelay: `${i * 40}ms` }} className="liquid animate-pop flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm">{entry.reason}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-primary">
                  <Trophy className="size-3.5" /> +{formatNumber(entry.points)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

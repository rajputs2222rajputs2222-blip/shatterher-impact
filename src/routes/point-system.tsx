import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/shatter/ui-bits";
import { getPointRules } from "@/lib/public.functions";

export const Route = createFileRoute("/point-system")({
  head: () => ({
    meta: [
      { title: "Point System — ShatterHerLeaders" },
      { name: "description", content: "Every ShatterHer earning rule, by team: magazine pages, reels, research, reviews, poetry, partnerships, podcasts and more." },
      { property: "og:title", content: "Point System — ShatterHerLeaders" },
      { property: "og:description", content: "Every earning rule, by team." },
    ],
  }),
  loader: () => getPointRules(),
  component: PointSystem,
});

function PointSystem() {
  const teams = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="Point system"
        title="How effort turns into points."
        description="Points = approved quantity × points per unit. Only approved contributions count, and reviewers can adjust when a project's scope calls for it."
      />
      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        {teams.map((team) => {
          const highlight = team.slug === "partnerships" || team.slug === "content-review";
          return (
            <section
              key={team.id}
              className={cn(
                "rounded-2xl border border-border bg-card/50 p-6",
                highlight && "aurora border-primary/40",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden>{team.icon}</span>
                <div>
                  <h2 className="text-2xl">{team.name}</h2>
                  <p className="text-sm text-muted-foreground">{team.description}</p>
                </div>
              </div>
              <ul className="mt-5 divide-y divide-border/70">
                {team.rules.map((rule) => (
                  <li key={rule.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{rule.name}</p>
                      {rule.description ? <p className="text-xs text-muted-foreground">{rule.description}</p> : null}
                    </div>
                    <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-primary">
                      {rule.points_per_unit}
                      <span className="block text-[11px] font-normal text-muted-foreground">per {rule.unit_label}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

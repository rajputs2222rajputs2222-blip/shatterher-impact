import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shatter/ui-bits";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — ShatterHerLeaders" },
      { name: "description", content: "Create, contribute, get recognized and earn points. Four steps from work to recognition." },
      { property: "og:title", content: "How It Works — ShatterHerLeaders" },
      { property: "og:description", content: "Four steps from work to recognition." },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  ["01", "Create", "Complete meaningful work for ShatterHer — a reel, a poem, a research report, a review, a partnership."],
  ["02", "Contribute", "Share what you created, researched, edited, planned, reviewed or accomplished. Upload files or write it directly."],
  ["03", "Get Recognized", "The team verifies your contribution. Nothing is scored automatically, so the leaderboard stays honest."],
  ["04", "Earn Points", "Approved contributions earn points and move you up the leaderboard."],
];

function HowItWorks() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="How it works" title="From work to recognition." description="Four steps, no guesswork." />
      <ol className="mt-12 space-y-4">
        {steps.map(([n, t, d]) => (
          <li key={n} className="flex flex-col gap-4 rounded-2xl border border-border bg-card/50 p-6 sm:flex-row sm:items-center sm:gap-8">
            <span className="text-display text-5xl text-primary/70">{n}</span>
            <div>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild><Link to="/contribute">Share Your Contribution</Link></Button>
        <Button asChild variant="outline"><Link to="/point-system">See the point system</Link></Button>
      </div>
    </div>
  );
}

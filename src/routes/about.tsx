import { createFileRoute } from "@tanstack/react-router";
import { SectionHeading } from "@/components/shatter/ui-bits";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ShatterHer — ShatterHerLeaders" },
      { name: "description", content: "ShatterHer is a youth-led initiative empowering girls and women to lead, create and be heard." },
      { property: "og:title", content: "About ShatterHer" },
      { property: "og:description", content: "A youth-led initiative turning voices into action." },
    ],
  }),
  component: About,
});

const values = [
  ["Empowerment", "Space for girls and women to take up room and be heard."],
  ["Leadership", "Young people leading the work, not just taking part in it."],
  ["Creativity", "Poetry, film, design, research — every craft has a place."],
  ["Collaboration", "We build together, and we credit each other."],
  ["Youth participation", "Decisions shaped by the people doing the work."],
  ["Community", "Support first. Recognition follows."],
];

function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <SectionHeading
        eyebrow="About"
        title={<>ShatterHer is about turning <span className="italic text-primary">voices into action.</span></>}
        description="ShatterHer is a youth-led initiative built around empowering girls and women — encouraging their voices, creativity, leadership and participation."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {values.map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-border bg-card/50 p-6">
            <h3 className="text-xl">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
      <div className="aurora mt-12 rounded-3xl border border-border p-8 sm:p-12">
        <h2 className="text-3xl sm:text-4xl">Why ShatterHerLeaders exists</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Community work is often invisible. ShatterHerLeaders makes it visible — a shared record of what our members
          create, review, research and build, so effort is recognised and nobody's work quietly disappears. The
          leaderboard celebrates contribution; it is never the point on its own.
        </p>
      </div>
    </div>
  );
}

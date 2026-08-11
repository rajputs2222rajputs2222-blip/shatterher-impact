import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shatter/ui-bits";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact ShatterHer — ShatterHerLeaders" },
      { name: "description", content: "Reach ShatterHer at shatterher.global@gmail.com or follow @shatterher_official on Instagram." },
      { property: "og:title", content: "Contact ShatterHer" },
      { property: "og:description", content: "Email us or follow @shatterher_official." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Contact" title="Let's talk." description="Questions, partnerships or want to join a team? We'd love to hear from you." />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a href="mailto:shatterher.global@gmail.com" className="rounded-2xl border border-border bg-card/50 p-6 transition-colors hover:border-primary/50">
          <Mail className="size-6 text-primary" />
          <h3 className="mt-4 text-xl">Email</h3>
          <p className="mt-1 break-all text-sm text-muted-foreground">shatterher.global@gmail.com</p>
        </a>
        <div className="aurora rounded-2xl border border-border p-6">
          <Instagram className="size-6 text-primary" />
          <h3 className="mt-4 text-xl">Instagram</h3>
          <p className="mt-1 text-sm text-muted-foreground">@shatterher_official</p>
          <Button asChild className="mt-5">
            <a href="https://instagram.com/shatterher_official" target="_blank" rel="noreferrer">Follow ShatterHer on Instagram</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

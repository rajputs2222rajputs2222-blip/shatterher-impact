import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card/30 pb-24 lg:pb-10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-display text-2xl">
            ShatterHer<span className="text-primary">Leaders</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Every page. Every reel. Every idea. Every voice. Recognition for the work that moves ShatterHer forward.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <Link to="/leaderboard" className="hover:text-foreground">
            Leaderboard
          </Link>
          <Link to="/point-system" className="hover:text-foreground">
            Point System
          </Link>
          <Link to="/how-it-works" className="hover:text-foreground">
            How It Works
          </Link>
          <Link to="/about" className="hover:text-foreground">
            About
          </Link>
          <Link to="/contact" className="hover:text-foreground">
            Contact
          </Link>
          <Link to="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
        </nav>
        <div className="space-y-3 text-sm">
          <a
            href="mailto:shatterher.global@gmail.com"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Mail className="size-4" /> shatterher.global@gmail.com
          </a>
          <a
            href="https://instagram.com/shatterher_official"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Instagram className="size-4" /> @shatterher_official
          </a>
          <p className="pt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} ShatterHer. A youth-led initiative.
          </p>
        </div>
      </div>
    </footer>
  );
}
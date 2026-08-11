import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { initials } from "@/lib/format";

const links = [
  { to: "/", label: "Home" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/point-system", label: "Point System" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, profile, isStaff, signOut } = useSession();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            SH
          </span>
          <span className="text-display text-lg tracking-tight sm:text-xl">
            ShatterHer<span className="text-primary">Leaders</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              activeProps={{ className: "text-foreground" }}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Button asChild size="sm">
                <Link to="/contribute">
                  <Plus className="size-4" /> Share Contribution
                </Link>
              </Button>
              {isStaff ? (
                <Button asChild size="sm" variant="ghost">
                  <Link to="/review">Review</Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="ghost">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Link
                to="/profile"
                className="grid size-9 place-items-center rounded-full border border-border bg-secondary text-xs font-semibold"
                aria-label="Your profile"
              >
                {initials(profile?.full_name ?? "SH")}
              </Link>
              <Button size="sm" variant="ghost" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth">Join ShatterHer</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-lg border border-border lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-sm text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: link.to === "/" }}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link to="/contribute">
                      <Plus className="size-4" /> Share Your Contribution
                    </Link>
                  </Button>
                  {isStaff ? (
                    <Button asChild variant="outline" onClick={() => setOpen(false)}>
                      <Link to="/review">Contribution Review</Link>
                    </Button>
                  ) : null}
                  <Button variant="ghost" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </>
              ) : (
                <Button asChild onClick={() => setOpen(false)}>
                  <Link to="/auth">Sign in / Join</Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
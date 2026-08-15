import { Link } from "@tanstack/react-router";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/contribute", label: "Contribute" },
  { to: "/my-contributions", label: "My Contributions" },
  { to: "/points", label: "Points" },
  { to: "/achievements", label: "Achievements" },
  { to: "/profile", label: "Profile" },
] as const;

export function MemberNav() {
  return (
    <nav className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Member area">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeProps={{ className: "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30" }}
          className="tap glass-interactive shrink-0 rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function MemberShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-28 sm:px-6 sm:py-14 lg:pb-16">
      <MemberNav />
      {children}
    </div>
  );
}

import { Link } from "@tanstack/react-router";

const items = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/content", label: "Content" },
  { to: "/admin/members", label: "Members" },
  { to: "/admin/teams", label: "Teams & Points" },
  { to: "/admin/achievements", label: "Achievements" },
  { to: "/review", label: "Submissions" },
] as const;

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-28 sm:px-6 sm:py-14 lg:pb-16">
      <nav className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Admin">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: "exact" in item ? item.exact : false }}
            activeProps={{ className: "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30" }}
            className="tap shrink-0 rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { BarChart3, Home, Menu, Plus, Trophy } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export function MobileTabBar() {
  const { user } = useSession();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <Tab to="/" label="Home" icon={<Home className="size-5" />} exact />
        <Tab to="/leaderboard" label="Leaders" icon={<Trophy className="size-5" />} />
        <Link
          to={user ? "/contribute" : "/auth"}
          className="mx-auto -mt-6 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
          aria-label="Share your contribution"
        >
          <Plus className="size-6" />
        </Link>
        <Tab to={user ? "/dashboard" : "/auth"} label="Progress" icon={<BarChart3 className="size-5" />} />
        <Tab to="/point-system" label="More" icon={<Menu className="size-5" />} />
      </div>
    </nav>
  );
}

function Tab({
  to,
  label,
  icon,
  exact,
}: {
  to: "/" | "/leaderboard" | "/dashboard" | "/auth" | "/point-system";
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: Boolean(exact) }}
      activeProps={{ className: "text-primary" }}
      className="flex flex-col items-center gap-1 py-1 text-[10px] font-medium text-muted-foreground"
    >
      {icon}
      {label}
    </Link>
  );
}
import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, profileLoading } = useSession();

  if (profileLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="liquid animate-pop p-8">
          <ShieldAlert className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is restricted. Sign in with an admin account to manage the site.
          </p>
          <Button asChild className="mt-6">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

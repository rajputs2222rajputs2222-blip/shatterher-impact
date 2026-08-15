import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { verifyAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  loader: async () => {
    let ok = false;
    try {
      ok = (await verifyAdmin()).isAdmin;
    } catch {
      ok = false;
    }
    if (!ok) throw redirect({ to: "/admin-login" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, rolesLoading } = useSession();

  if (rolesLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="glass-elevated animate-pop rounded-3xl p-8">
          <ShieldAlert className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-2xl">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is restricted. Sign in with an admin account to manage the site.
          </p>
          <Button asChild className="mt-6">
            <Link to="/admin-login">Admin sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

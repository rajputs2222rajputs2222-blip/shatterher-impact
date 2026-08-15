import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Eyebrow } from "@/components/shatter/ui-bits";
import { verifyAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin sign in — ShatterHerLeaders" },
      { name: "description", content: "Restricted admin access for the ShatterHerLeaders control center." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin sign in — ShatterHerLeaders" },
      { property: "og:description", content: "Restricted admin access for the ShatterHerLeaders control center." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const check = useServerFn(verifyAdmin);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { isAdmin } = await check();
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error("This account does not have admin access.");
        return;
      }
      toast.success("Admin verified.");
      navigate({ to: "/admin", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
      <div className="glass-elevated animate-pop rounded-3xl p-6 sm:p-8">
        <Eyebrow>
          <ShieldCheck className="size-3" /> Restricted
        </Eyebrow>
        <h1 className="mt-4 text-4xl leading-tight">Admin control center</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Admin accounts only. Access is verified on the server after sign-in — member accounts are signed out
          immediately.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin email</Label>
            <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <Button type="submit" size="lg" className="tap w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null} Sign in as admin
          </Button>
        </form>
        <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
          <Link to="/auth" className="tap hover:text-foreground">
            Member sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}

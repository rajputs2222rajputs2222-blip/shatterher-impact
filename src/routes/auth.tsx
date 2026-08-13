import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Eyebrow } from "@/components/shatter/ui-bits";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ShatterHerLeaders" },
      { name: "description", content: "Sign in or join ShatterHer to share contributions, earn points and climb the leaderboard." },
      { property: "og:title", content: "Sign in — ShatterHerLeaders" },
      { property: "og:description", content: "Join the ShatterHer movement and start earning recognition for your work." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email) { toast.error("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent.");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
      <div className="liquid animate-pop p-6 sm:p-8">
        <Eyebrow>
          <Sparkles className="size-3" /> ShatterHer
        </Eyebrow>
        <h1 className="mt-4 text-4xl leading-tight">
          {mode === "signin" ? "Welcome back." : "Join the movement."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to share contributions and track your points."
            : "New members start as pending until an admin activates your account."}
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm animate-pop">
            We sent a confirmation link to <span className="font-medium">{email}</span>. Click it to finish joining.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <div className="animate-pop space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Aanya Sharma" />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@shatterher.org" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
            </div>
            <Button type="submit" className="tap w-full" size="lg" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
          <p className="text-xs text-muted-foreground">
            Admins: sign in here with your admin account to open the CMS control center.
          </p>
          <button type="button" className="tap text-left hover:text-foreground" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setSent(false); }}>
            {mode === "signin" ? "New here? Create an account" : "Already a member? Sign in"}
          </button>
          {mode === "signin" ? (
            <button type="button" className="tap text-left hover:text-foreground" onClick={resetPassword}>
              Forgot your password?
            </button>
          ) : null}
          <Link to="/leaderboard" className="tap hover:text-foreground">
            Just browsing? See the leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}

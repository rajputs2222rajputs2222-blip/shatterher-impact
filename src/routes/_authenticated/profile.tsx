import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MemberShell } from "@/components/shatter/member-nav";
import { StatusBadge } from "@/components/shatter/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile } = useSession();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setRoleTitle(profile.role_title ?? "");
    setBio(profile.bio ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setTeamId(profile.team_id);
  }, [profile]);

  const teams = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role_title: roleTitle || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
        team_id: teamId,
      })
      .eq("id", profile.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated.");
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
  }

  return (
    <MemberShell>
      <h1 className="text-4xl leading-tight animate-rise sm:text-5xl">Your profile</h1>

      <form onSubmit={save} className="liquid animate-pop mt-8 space-y-5 p-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-16 rounded-full object-cover ring-2 ring-primary/30" />
          ) : (
            <span className="grid size-16 place-items-center rounded-full border border-border bg-secondary font-semibold">
              {initials(fullName || "SH")}
            </span>
          )}
          <div>
            <p className="font-medium">{fullName || "New member"}</p>
            <div className="mt-1"><StatusBadge status={profile?.status ?? "pending"} /></div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full">Full name</Label>
          <Input id="full" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role title</Label>
          <Input id="role" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Content Creator" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar image URL</Label>
          <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Team</Label>
          <div className="flex flex-wrap gap-2">
            {(teams.data ?? []).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTeamId(teamId === t.id ? null : t.id)}
                className={cn(
                  "tap rounded-full border px-3 py-1.5 text-xs",
                  teamId === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <Button className="tap" size="lg" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null} Save changes
        </Button>
      </form>
    </MemberShell>
  );
}

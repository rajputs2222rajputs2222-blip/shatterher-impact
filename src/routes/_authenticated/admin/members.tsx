import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, ShieldCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/shatter/admin-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shatter/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/members")({
  head: () => ({
    meta: [
      { title: "Members — ShatterHerLeaders admin" },
      { name: "description", content: "Approve new members, manage teams and grant reviewer or admin access." },
      { property: "og:title", content: "Members — ShatterHerLeaders admin" },
      { property: "og:description", content: "Approve signups and manage member access." },
    ],
  }),
  component: AdminMembers,
});

type Member = {
  id: string;
  user_id: string | null;
  full_name: string;
  role_title: string | null;
  team_id: string | null;
  status: string;
  total_points: number;
  total_contributions: number;
};

function AdminMembers() {
  const queryClient = useQueryClient();

  const members = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, role_title, team_id, status, total_points, total_contributions")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Member[];
    },
  });

  const teams = useQuery({
    queryKey: ["admin-teams-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Member> }) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role, grant }: { userId: string; role: "admin" | "reviewer"; grant: boolean }) => {
      if (grant) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Access updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not change access"),
  });

  if (members.isLoading) {
    return (
      <AdminShell title="Members">
        <div className="grid h-40 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      </AdminShell>
    );
  }

  const list = members.data ?? [];

  return (
    <AdminShell title="Members" description="Approve signups, assign teams and manage access.">
      {list.length === 0 ? (
        <EmptyState title="No members yet" description="Members appear here as soon as people join." />
      ) : (
        <ul className="space-y-3">
          {list.map((member) => {
            const memberRoles = (roles.data ?? []).filter((r) => r.user_id === member.user_id).map((r) => r.role);
            return (
              <li key={member.id} className="liquid bulge animate-pop p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
                    {initials(member.full_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.status} · {member.total_points} pts · {member.total_contributions} contributions
                      {memberRoles.length ? ` · ${memberRoles.join(", ")}` : ""}
                    </p>
                  </div>
                  <select
                    className="tap rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm"
                    value={member.team_id ?? ""}
                    onChange={(e) => update.mutate({ id: member.id, patch: { team_id: e.target.value || null } })}
                    aria-label={`Team for ${member.full_name}`}
                  >
                    <option value="">No team</option>
                    {(teams.data ?? []).map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                  {member.status !== "active" ? (
                    <Button size="sm" className="tap" onClick={() => update.mutate({ id: member.id, patch: { status: "active" } })}>
                      <Check className="size-4" /> Approve
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="tap" onClick={() => update.mutate({ id: member.id, patch: { status: "inactive" } })}>
                      <UserX className="size-4" /> Deactivate
                    </Button>
                  )}
                  {member.user_id ? (
                    <>
                      <Button
                        size="sm"
                        variant={memberRoles.includes("reviewer") ? "secondary" : "ghost"}
                        className="tap"
                        onClick={() => setRole.mutate({ userId: member.user_id!, role: "reviewer", grant: !memberRoles.includes("reviewer") })}
                      >
                        Reviewer
                      </Button>
                      <Button
                        size="sm"
                        variant={memberRoles.includes("admin") ? "secondary" : "ghost"}
                        className="tap"
                        onClick={() => setRole.mutate({ userId: member.user_id!, role: "admin", grant: !memberRoles.includes("admin") })}
                      >
                        <ShieldCheck className="size-4" /> Admin
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}

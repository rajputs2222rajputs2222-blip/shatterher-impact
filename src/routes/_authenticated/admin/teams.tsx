import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/shatter/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/teams")({
  head: () => ({
    meta: [
      { title: "Teams & points — ShatterHerLeaders admin" },
      { name: "description", content: "Create teams and set how many points each type of contribution earns." },
      { property: "og:title", content: "Teams & points — ShatterHerLeaders admin" },
      { property: "og:description", content: "Manage teams, task types and point values." },
    ],
  }),
  component: AdminTeams,
});

type Team = { id: string; slug: string; name: string; description: string | null; icon: string | null; sort_order: number };
type TaskType = {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  unit_label: string;
  points_per_unit: number;
  active: boolean;
  sort_order: number;
};

function AdminTeams() {
  const queryClient = useQueryClient();
  const [newTeam, setNewTeam] = useState("");
  const invalidate = () => queryClient.invalidateQueries();

  const teams = useQuery({
    queryKey: ["admin-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("sort_order");
      if (error) throw error;
      return data as Team[];
    },
  });

  const tasks = useQuery({
    queryKey: ["admin-task-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_types").select("*").order("sort_order");
      if (error) throw error;
      return data as TaskType[];
    },
  });

  const mutate = useMutation({
    mutationFn: async (run: () => Promise<{ error: unknown }>) => {
      const { error } = await run();
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved.");
      void invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Save failed"),
  });

  if (teams.isLoading || tasks.isLoading) {
    return (
      <AdminShell title="Teams & points">
        <div className="grid h-40 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Teams & points" description="Define the teams members can join and what each contribution is worth.">
      <div className="liquid bulge animate-pop flex flex-wrap items-end gap-3 p-5">
        <div className="min-w-[200px] flex-1">
          <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground" htmlFor="new-team">New team</label>
          <Input id="new-team" className="mt-2" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} placeholder="Team name" />
        </div>
        <Button
          className="tap"
          disabled={!newTeam.trim()}
          onClick={() => {
            const name = newTeam.trim();
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            mutate.mutate(async () => supabase.from("teams").insert({ name, slug, sort_order: (teams.data?.length ?? 0) + 1 }));
            setNewTeam("");
          }}
        >
          <Plus className="size-4" /> Add team
        </Button>
      </div>

      <div className="mt-6 space-y-6">
        {(teams.data ?? []).map((team) => (
          <section key={team.id} className="liquid bulge animate-pop p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                className="max-w-xs"
                defaultValue={team.name}
                onBlur={(e) =>
                  e.target.value !== team.name &&
                  mutate.mutate(async () => supabase.from("teams").update({ name: e.target.value }).eq("id", team.id))
                }
                aria-label="Team name"
              />
              <Input
                className="max-w-sm"
                defaultValue={team.description ?? ""}
                placeholder="Short description"
                onBlur={(e) =>
                  e.target.value !== (team.description ?? "") &&
                  mutate.mutate(async () => supabase.from("teams").update({ description: e.target.value }).eq("id", team.id))
                }
                aria-label="Team description"
              />
              <Button
                size="sm"
                variant="ghost"
                className="tap ml-auto text-destructive"
                onClick={() => mutate.mutate(async () => supabase.from("teams").delete().eq("id", team.id))}
              >
                <Trash2 className="size-4" /> Delete team
              </Button>
            </div>

            <ul className="mt-5 space-y-2">
              {(tasks.data ?? [])
                .filter((t) => t.team_id === team.id)
                .map((task) => (
                  <li key={task.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/30 p-3">
                    <Input
                      className="max-w-[220px]"
                      defaultValue={task.name}
                      onBlur={(e) =>
                        e.target.value !== task.name &&
                        mutate.mutate(async () => supabase.from("task_types").update({ name: e.target.value }).eq("id", task.id))
                      }
                      aria-label="Task name"
                    />
                    <Input
                      className="max-w-[140px]"
                      defaultValue={task.unit_label}
                      onBlur={(e) =>
                        e.target.value !== task.unit_label &&
                        mutate.mutate(async () => supabase.from("task_types").update({ unit_label: e.target.value }).eq("id", task.id))
                      }
                      aria-label="Unit label"
                    />
                    <Input
                      type="number"
                      className="max-w-[110px]"
                      defaultValue={task.points_per_unit}
                      onBlur={(e) =>
                        Number(e.target.value) !== task.points_per_unit &&
                        mutate.mutate(async () =>
                          supabase.from("task_types").update({ points_per_unit: Number(e.target.value) }).eq("id", task.id),
                        )
                      }
                      aria-label="Points per unit"
                    />
                    <Button
                      size="sm"
                      variant={task.active ? "secondary" : "ghost"}
                      className="tap"
                      onClick={() => mutate.mutate(async () => supabase.from("task_types").update({ active: !task.active }).eq("id", task.id))}
                    >
                      {task.active ? "Active" : "Hidden"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="tap text-destructive"
                      onClick={() => mutate.mutate(async () => supabase.from("task_types").delete().eq("id", task.id))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
            </ul>

            <Button
              size="sm"
              variant="outline"
              className="tap mt-4"
              onClick={() =>
                mutate.mutate(async () =>
                  supabase.from("task_types").insert({
                    team_id: team.id,
                    name: "New contribution type",
                    unit_label: "unit",
                    points_per_unit: 10,
                    sort_order: (tasks.data ?? []).filter((t) => t.team_id === team.id).length + 1,
                  }),
                )
              }
            >
              <Plus className="size-4" /> Add point rule
            </Button>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}

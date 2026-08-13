import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/shatter/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — ShatterHerLeaders admin" },
      { name: "description", content: "Create and edit the badges members can earn on ShatterHerLeaders." },
      { property: "og:title", content: "Achievements — ShatterHerLeaders admin" },
      { property: "og:description", content: "Manage the badge collection." },
    ],
  }),
  component: AdminAchievements,
});

type Achievement = { id: string; code: string; name: string; description: string; icon: string; sort_order: number };

function AdminAchievements() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-achievements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("achievements").select("*").order("sort_order");
      if (error) throw error;
      return data as Achievement[];
    },
  });

  const mutate = useMutation({
    mutationFn: async (run: () => Promise<{ error: unknown }>) => {
      const { error } = await run();
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved.");
      void queryClient.invalidateQueries({ queryKey: ["admin-achievements"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Save failed"),
  });

  if (list.isLoading) {
    return (
      <AdminShell title="Achievements">
        <div className="grid h-40 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Achievements" description="Badges members unlock as they contribute.">
      <ul className="space-y-3">
        {(list.data ?? []).map((item) => (
          <li key={item.id} className="liquid bulge animate-pop flex flex-wrap items-center gap-2 p-4">
            <Input
              className="max-w-[90px]"
              defaultValue={item.icon}
              onBlur={(e) => e.target.value !== item.icon && mutate.mutate(async () => supabase.from("achievements").update({ icon: e.target.value }).eq("id", item.id))}
              aria-label="Icon"
            />
            <Input
              className="max-w-[220px]"
              defaultValue={item.name}
              onBlur={(e) => e.target.value !== item.name && mutate.mutate(async () => supabase.from("achievements").update({ name: e.target.value }).eq("id", item.id))}
              aria-label="Name"
            />
            <Input
              className="min-w-[220px] flex-1"
              defaultValue={item.description}
              onBlur={(e) => e.target.value !== item.description && mutate.mutate(async () => supabase.from("achievements").update({ description: e.target.value }).eq("id", item.id))}
              aria-label="Description"
            />
            <Button
              size="sm"
              variant="ghost"
              className="tap text-destructive"
              onClick={() => mutate.mutate(async () => supabase.from("achievements").delete().eq("id", item.id))}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        className="tap mt-6"
        onClick={() =>
          mutate.mutate(async () =>
            supabase.from("achievements").insert({
              code: `badge_${Date.now()}`,
              name: "New badge",
              description: "Describe how this badge is earned.",
              icon: "star",
              sort_order: (list.data?.length ?? 0) + 1,
            }),
          )
        }
      >
        <Plus className="size-4" /> Add achievement
      </Button>
    </AdminShell>
  );
}

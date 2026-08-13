import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/shatter/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => ({
    meta: [
      { title: "Site content — ShatterHerLeaders admin" },
      { name: "description", content: "Edit every headline, description, link and image shown on the ShatterHer site." },
      { property: "og:title", content: "Site content — ShatterHerLeaders admin" },
      { property: "og:description", content: "Edit the copy and imagery across the site." },
    ],
  }),
  component: AdminContent,
});

type Row = {
  id: string;
  key: string;
  group_name: string;
  label: string;
  kind: string;
  value: string;
  sort_order: number;
};

function AdminContent() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});

  const rows = useQuery({
    queryKey: ["admin-content"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("site_content")
        .select("id, key, group_name, label, kind, value, sort_order")
        .order("group_name")
        .order("sort_order");
      if (error) throw error;
      return data as Row[];
    },
  });

  useEffect(() => {
    if (rows.data) {
      setDraft(Object.fromEntries(rows.data.map((r) => [r.id, r.value ?? ""])));
    }
  }, [rows.data]);

  const save = useMutation({
    mutationFn: async () => {
      const changed = (rows.data ?? []).filter((r) => (draft[r.id] ?? "") !== (r.value ?? ""));
      for (const row of changed) {
        const { error } = await supabase
          .from("site_content")
          .update({ value: draft[row.id] ?? "" })
          .eq("id", row.id);
        if (error) throw error;
      }
      return changed.length;
    },
    onSuccess: (count) => {
      toast.success(count === 0 ? "Nothing to save." : `Saved ${count} change${count === 1 ? "" : "s"}.`);
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save"),
  });

  if (rows.isLoading) {
    return (
      <AdminShell title="Site content">
        <div className="grid h-40 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      </AdminShell>
    );
  }

  const groups = Array.from(new Set((rows.data ?? []).map((r) => r.group_name)));

  return (
    <AdminShell title="Site content" description="Everything visitors read on the site is edited here.">
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group} className="liquid bulge animate-pop p-5 sm:p-6">
            <h2 className="text-xl capitalize">{group}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {(rows.data ?? [])
                .filter((r) => r.group_name === group)
                .map((row) => (
                  <div key={row.id} className={row.kind === "textarea" ? "md:col-span-2" : undefined}>
                    <Label htmlFor={row.id} className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {row.label}
                    </Label>
                    {row.kind === "textarea" ? (
                      <Textarea
                        id={row.id}
                        className="mt-2"
                        rows={3}
                        value={draft[row.id] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [row.id]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        id={row.id}
                        className="mt-2"
                        placeholder={row.kind === "image" ? "https://…" : undefined}
                        value={draft[row.id] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [row.id]: e.target.value }))}
                      />
                    )}
                    {row.kind === "image" && (draft[row.id] ?? "").trim() ? (
                      <img
                        src={draft[row.id]}
                        alt={`${row.label} preview`}
                        className="mt-3 h-20 w-auto rounded-lg border border-border object-contain"
                      />
                    ) : null}
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-24 mt-8 flex justify-end lg:bottom-6">
        <Button size="lg" className="tap" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
        </Button>
      </div>
    </AdminShell>
  );
}

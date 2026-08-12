import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Paperclip, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberShell } from "@/components/shatter/member-nav";
import { EmptyState, StatusBadge } from "@/components/shatter/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/my-contributions")({
  component: MyContributions,
});

function MyContributions() {
  const { user } = useSession();
  const query = useQuery({
    queryKey: ["my-submissions", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, title, status, quantity, awarded_points, review_note, submitted_at, task_types(name, unit_label, teams(name)), submission_files(id)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rows = query.data ?? [];

  return (
    <MemberShell>
      <div className="flex flex-wrap items-end justify-between gap-4 animate-rise">
        <h1 className="text-4xl leading-tight sm:text-5xl">My contributions</h1>
        <Button asChild className="tap"><Link to="/contribute"><Plus className="size-4" /> New</Link></Button>
      </div>

      {rows.length === 0 && !query.isLoading ? (
        <div className="mt-8">
          <EmptyState
            title="No contributions yet"
            description="Share your first piece of work and start earning points."
            action={<Button asChild className="tap"><Link to="/contribute">Share your contribution</Link></Button>}
          />
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        {rows.map((s, i) => {
          const task = s.task_types as { name: string; unit_label: string; teams: { name: string } | null } | null;
          const files = (s.submission_files as { id: string }[] | null) ?? [];
          return (
            <div key={s.id} style={{ animationDelay: `${i * 45}ms` }} className="liquid liquid-hover animate-pop p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task?.teams?.name} · {task?.name} · {s.quantity} {task?.unit_label} · {formatDate(s.submitted_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {files.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Paperclip className="size-3" /> {files.length}</span>
                  ) : null}
                  {s.awarded_points ? <span className="text-sm font-semibold tabular-nums text-primary">+{s.awarded_points}</span> : null}
                  <StatusBadge status={s.status} />
                </div>
              </div>
              {s.review_note ? (
                <p className="mt-3 rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                  Reviewer note: {s.review_note}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </MemberShell>
  );
}

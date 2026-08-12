import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MemberShell } from "@/components/shatter/member-nav";
import { EmptyState, StatusBadge } from "@/components/shatter/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/review")({
  component: ReviewQueue,
});

type Row = {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  text_content: string | null;
  quantity: number;
  status: string;
  submitted_at: string;
  profiles: { full_name: string } | null;
  task_types: { name: string; unit_label: string; points_per_unit: number } | null;
};

function ReviewQueue() {
  const { isStaff, user } = useSession();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<Row | null>(null);
  const [points, setPoints] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ["review-queue"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, profile_id, title, description, text_content, quantity, status, submitted_at, profiles(full_name), task_types(name, unit_label, points_per_unit)")
        .eq("status", "pending")
        .order("submitted_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  if (!isStaff) {
    return (
      <MemberShell>
        <EmptyState title="Reviewers only" description="This area is for admins and reviewers." />
      </MemberShell>
    );
  }

  function open(row: Row) {
    setActive(row);
    setPoints(row.quantity * (row.task_types?.points_per_unit ?? 0));
    setNote("");
  }

  async function decide(status: "approved" | "rejected" | "revision") {
    if (!active || !user) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          status,
          awarded_points: status === "approved" ? points : null,
          review_note: note || null,
          reviewer_id: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", active.id);
      if (error) throw error;

      if (status === "approved") {
        const { error: ledgerError } = await supabase.from("points_ledger").insert({
          profile_id: active.profile_id,
          submission_id: active.id,
          points,
          reason: active.title,
          created_by: user.id,
        });
        if (ledgerError) throw ledgerError;
      }
      toast.success(`Contribution ${status}.`);
      setActive(null);
      queryClient.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }

  const rows = query.data ?? [];

  return (
    <MemberShell>
      <h1 className="text-4xl leading-tight animate-rise sm:text-5xl">Review queue</h1>
      <p className="mt-3 text-sm text-muted-foreground">{rows.length} contribution{rows.length === 1 ? "" : "s"} awaiting review.</p>

      {rows.length === 0 && !query.isLoading ? (
        <div className="mt-8"><EmptyState title="All clear" description="No pending contributions right now." /></div>
      ) : null}

      <div className="mt-8 space-y-3">
        {rows.map((row, i) => (
          <button
            key={row.id}
            type="button"
            onClick={() => open(row)}
            style={{ animationDelay: `${i * 45}ms` }}
            className="liquid liquid-hover tap animate-pop flex w-full items-center justify-between gap-4 p-5 text-left"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{row.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.profiles?.full_name} · {row.task_types?.name} · {row.quantity} {row.task_types?.unit_label} · {formatDate(row.submitted_at)}
              </p>
            </div>
            <StatusBadge status={row.status} />
          </button>
        ))}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="liquid max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{active?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {active?.profiles?.full_name} · {active?.task_types?.name} · {active?.quantity} {active?.task_types?.unit_label}
          </p>
          {active?.description ? <p className="text-sm text-muted-foreground">{active.description}</p> : null}
          {active?.text_content ? (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-secondary/30 p-3 text-xs">{active.text_content}</pre>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm" htmlFor="pts">Points to award</label>
            <Input id="pts" type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="note">Reviewer note</label>
            <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="tap flex-1" disabled={busy} onClick={() => decide("approved")}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
            </Button>
            <Button variant="outline" className="tap" disabled={busy} onClick={() => decide("revision")}>
              <RotateCcw className="size-4" /> Revision
            </Button>
            <Button variant="outline" className="tap" disabled={busy} onClick={() => decide("rejected")}>
              <X className="size-4" /> Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MemberShell>
  );
}

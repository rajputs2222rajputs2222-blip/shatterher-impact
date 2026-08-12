import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, CloudUpload, FileText, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MemberShell } from "@/components/shatter/member-nav";
import { Eyebrow } from "@/components/shatter/ui-bits";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/contribute")({
  component: Contribute,
});

const MAX_SIZE = 50 * 1024 * 1024;

function Contribute() {
  const { profile, user } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [textContent, setTextContent] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const teams = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name, description, icon").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const tasks = useQuery({
    queryKey: ["task-types", teamId],
    enabled: Boolean(teamId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_types")
        .select("id, name, description, unit_label, points_per_unit")
        .eq("team_id", teamId!)
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const task = useMemo(() => (tasks.data ?? []).find((t) => t.id === taskId) ?? null, [tasks.data, taskId]);
  const locked = profile?.status === "pending";

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).filter((f) => {
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name} is larger than 50 MB`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...next]);
  }

  async function submit() {
    if (!user || !profile || !task) return;
    if (!title.trim()) { toast.error("Give your contribution a title"); return; }
    setBusy(true);
    try {
      const { data: submission, error } = await supabase
        .from("submissions")
        .insert({
          profile_id: profile.id,
          user_id: user.id,
          task_type_id: task.id,
          title: title.trim(),
          description: description.trim() || null,
          text_content: textContent.trim() || null,
          quantity,
        })
        .select("id")
        .single();
      if (error) throw error;

      for (const file of files) {
        const path = `${user.id}/${submission.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const upload = await supabase.storage.from("contributions").upload(path, file);
        if (upload.error) throw upload.error;
        const { error: fileError } = await supabase.from("submission_files").insert({
          submission_id: submission.id,
          user_id: user.id,
          file_name: file.name,
          file_path: path,
          file_type: file.type || null,
          file_size: file.size,
        });
        if (fileError) throw fileError;
      }
      setDone(true);
      toast.success("Contribution submitted for review!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <MemberShell>
        <div className="liquid animate-pop mx-auto max-w-md p-8 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary/20 text-primary animate-pop">
            <Check className="size-8" />
          </span>
          <h1 className="mt-5 text-3xl">Contribution shared.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It's now pending review. Once approved, your points land on the leaderboard.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button className="tap" onClick={() => navigate({ to: "/my-contributions" })}>See my contributions</Button>
            <Button variant="outline" className="tap" onClick={() => { setDone(false); setStep(1); setTeamId(null); setTaskId(null); setTitle(""); setDescription(""); setTextContent(""); setQuantity(1); setFiles([]); }}>
              Share another
            </Button>
          </div>
        </div>
      </MemberShell>
    );
  }

  return (
    <MemberShell>
      <div className="animate-rise">
        <Eyebrow><Sparkles className="size-3" /> Step {step} of 3</Eyebrow>
        <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">Share your contribution.</h1>
      </div>

      <div className="mt-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", s <= step ? "bg-primary" : "bg-secondary")} />
        ))}
      </div>

      {locked ? (
        <div className="liquid animate-pop mt-6 border-accent/40 p-4 text-sm">
          Your account is pending approval — you can prepare a contribution, but submitting unlocks once an admin activates you.
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {(teams.data ?? []).map((team, i) => (
            <button
              key={team.id}
              type="button"
              style={{ animationDelay: `${i * 45}ms` }}
              onClick={() => { setTeamId(team.id); setTaskId(null); setStep(2); }}
              className={cn("liquid liquid-hover tap animate-pop p-5 text-left", teamId === team.id && "border-primary/60")}
            >
              <p className="text-lg font-medium">{team.name}</p>
              {team.description ? <p className="mt-1 text-xs text-muted-foreground">{team.description}</p> : null}
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-8">
          <BackButton onClick={() => setStep(1)} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(tasks.data ?? []).map((t, i) => (
              <button
                key={t.id}
                type="button"
                style={{ animationDelay: `${i * 45}ms` }}
                onClick={() => { setTaskId(t.id); setStep(3); }}
                className={cn("liquid liquid-hover tap animate-pop p-5 text-left", taskId === t.id && "border-primary/60")}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{t.name}</p>
                  <span className="shrink-0 rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
                    {t.points_per_unit} / {t.unit_label}
                  </span>
                </div>
                {t.description ? <p className="mt-1 text-xs text-muted-foreground">{t.description}</p> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 && task ? (
        <div className="mt-8">
          <BackButton onClick={() => setStep(2)} />
          <div className="liquid animate-pop mt-4 space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="title">What did you create or accomplish?</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 4-page spread for the September issue" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Tell us about your contribution</Label>
              <Textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Context, collaborators, links…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">How much did you contribute? ({task.unit_label})</Label>
              <Input id="qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
              <p className="text-xs text-muted-foreground">
                Estimated <span className="text-primary">{quantity * task.points_per_unit} points</span> if approved.
              </p>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
              className={cn(
                "rounded-2xl border border-dashed p-6 text-center transition-all duration-300",
                dragging ? "scale-[1.01] border-primary bg-primary/10" : "border-border bg-secondary/20",
              )}
            >
              <CloudUpload className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-2 text-sm">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground">Images, video, audio, PDF, docs, sheets, slides, ZIP — up to 50 MB each</p>
              <label className="tap mt-4 inline-flex cursor-pointer items-center rounded-full border border-border bg-secondary/60 px-4 py-2 text-sm hover:border-primary/50">
                Browse files
                <input type="file" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
              </label>
            </div>

            {files.length > 0 ? (
              <ul className="space-y-2">
                {files.map((file, i) => (
                  <li key={`${file.name}-${i}`} className="animate-pop flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <button type="button" aria-label={`Remove ${file.name}`} className="tap rounded-full p-1 text-muted-foreground hover:text-destructive" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="text">Prefer to write it here?</Label>
              <Textarea id="text" rows={5} value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Paste your poem, script, research notes…" />
            </div>

            <Button size="lg" className="tap w-full" disabled={busy || locked} onClick={submit}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Submit for review
            </Button>
          </div>
        </div>
      ) : null}
    </MemberShell>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="tap inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Back
    </button>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Lock } from "lucide-react";
import { MemberShell } from "@/components/shatter/member-nav";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/achievements")({
  component: Achievements,
});

function Achievements() {
  const { profile } = useSession();

  const all = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("achievements").select("id, code, name, description, icon, sort_order").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const mine = useQuery({
    queryKey: ["my-achievements", profile?.id],
    enabled: Boolean(profile),
    queryFn: async () => {
      const { data, error } = await supabase.from("user_achievements").select("achievement_id, earned_at").eq("profile_id", profile!.id);
      if (error) throw error;
      return data;
    },
  });

  const earned = new Map((mine.data ?? []).map((a) => [a.achievement_id, a.earned_at]));

  return (
    <MemberShell>
      <h1 className="text-4xl leading-tight animate-rise sm:text-5xl">Achievements</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">Badges unlock automatically as your contributions are approved.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {(all.data ?? []).map((a, i) => {
          const at = earned.get(a.id);
          return (
            <div
              key={a.id}
              style={{ animationDelay: `${i * 50}ms` }}
              className={cn("liquid liquid-hover animate-pop flex items-start gap-4 p-5", !at && "opacity-60")}
            >
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", at ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground")}>
                {at ? <Award className="size-5" /> : <Lock className="size-4" />}
              </span>
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{at ? `Earned ${formatDate(at)}` : "Locked"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </MemberShell>
  );
}

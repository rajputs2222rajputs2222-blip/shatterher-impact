import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/shatter/count-up";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-4 text-3xl leading-[1.05] sm:text-4xl md:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  animate = false,
  accent = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  animate?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm sm:p-5",
        accent && "border-primary/40 bg-primary/10",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">
        {animate && typeof value === "number" ? <CountUp value={value} /> : value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  pending: "border-accent/40 bg-accent/15 text-accent",
  approved: "border-emerald-400/40 bg-emerald-400/15 text-emerald-300",
  rejected: "border-destructive/40 bg-destructive/15 text-destructive",
  revision: "border-primary/40 bg-primary/15 text-primary",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Not accepted",
  revision: "Revision required",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
        statusStyles[status] ?? "border-border bg-secondary text-muted-foreground",
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
      <h3 className="text-xl">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
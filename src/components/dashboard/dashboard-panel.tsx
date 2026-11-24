import { cn } from "@/lib/utils";
import type { DashboardPanelProps, DashboardStatTileProps } from "@/types/dashboard";

/** One dashboard widget: a titled card. */
export default function DashboardPanel({ title, description, className, children }: DashboardPanelProps) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground sm:p-5", className)}>
      <header>
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </header>
      {children}
    </section>
  );
}

/** A single number with its label, for the top of a panel. */
export function DashboardStatTile({ label, value, detail }: DashboardStatTileProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-md bg-muted/60 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-xl font-semibold tabular-nums">{value}</dd>
      {detail && <dd className="truncate text-xs text-muted-foreground">{detail}</dd>}
    </div>
  );
}

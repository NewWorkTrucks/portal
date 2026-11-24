import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardLoadErrorPanelProps } from "@/types/daily-tasks";

/** A failed load: the plain cause, the next step, and the raw error behind "Technical details". */
export default function DashboardLoadErrorPanel({ error, onRetry }: DashboardLoadErrorPanelProps) {
  return (
    <section role="alert" className="flex max-w-xl flex-col gap-3 rounded-lg border border-destructive/40 bg-card p-5 text-sm">
      <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
        <TriangleAlert aria-hidden className="size-4 shrink-0 text-destructive" />
        {error.title}
      </h2>
      <p className="text-muted-foreground">{error.description}</p>
      <details className="text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer rounded select-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          Technical details
        </summary>
        <p className="mt-1.5 rounded bg-muted px-2 py-1.5 font-mono break-all">{error.technicalDetails}</p>
      </details>
      <Button variant="outline" className="w-fit" onClick={onRetry}>
        <RotateCcw aria-hidden />
        Try again
      </Button>
    </section>
  );
}

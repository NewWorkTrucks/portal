import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type SettingsSectionProps = {
  title: string;
  description: string;
  isBeta?: boolean;
  children: ReactNode;
};

export default function SettingsSection({ title, description, isBeta = false, children }: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-base font-semibold">{title}</h2>
          {isBeta && <Badge variant="secondary">Beta</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}

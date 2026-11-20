import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground">
      <header>
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}

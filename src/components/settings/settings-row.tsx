import type { ReactNode } from "react";

type SettingsRowProps = {
  /** id of the control. Its label is `${controlId}-label` and description `${controlId}-description`, for aria-labelledby/describedby. */
  controlId: string;
  label: string;
  description: ReactNode;
  children: ReactNode;
};

/** One setting: label and description on the left, its control on the right. */
export default function SettingsRow({ controlId, label, description, children }: SettingsRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t pt-4 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <label id={`${controlId}-label`} htmlFor={controlId} className="text-sm font-medium">
          {label}
        </label>
        <p id={`${controlId}-description`} className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

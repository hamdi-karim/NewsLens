import type { ReactNode } from "react";

interface PreferenceSectionProps {
  title: string;
  hint: string;
  children: ReactNode;
}

// A fieldset, so screen readers announce the group name with each control.
export function PreferenceSection({
  title,
  hint,
  children,
}: PreferenceSectionProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-1 text-base font-semibold">{title}</legend>
      <p className="text-sm text-muted-foreground">{hint}</p>
      {children}
    </fieldset>
  );
}

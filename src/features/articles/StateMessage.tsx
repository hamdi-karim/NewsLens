import type { ReactNode } from "react";

interface StateMessageProps {
  title: string;
  description: string;
  // e.g. a Retry or Clear filters button
  action?: ReactNode;
  role?: "status" | "alert";
}

// Shared idle / empty / error message for data views.
export function StateMessage({
  title,
  description,
  action,
  role = "status",
}: StateMessageProps) {
  return (
    <div
      role={role}
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

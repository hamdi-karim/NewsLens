import { cn } from "@/shared/lib/utils";

// Decorative mark; the wordmark next to it names the link. Keep the shapes in
// sync with public/favicon.svg.
function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn("size-7 shrink-0", className)}
    >
      <rect
        width="32"
        height="32"
        rx="8"
        className="fill-blue-600 dark:fill-blue-500"
      />
      <g className="fill-white">
        <rect x="9.5" y="12" width="3" height="8" rx="1.5" />
        <rect x="14.5" y="9" width="3" height="14" rx="1.5" />
        <rect x="19.5" y="11" width="3" height="10" rx="1.5" />
      </g>
    </svg>
  );
}

export { Logo };

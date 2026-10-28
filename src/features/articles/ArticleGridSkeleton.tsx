import { Skeleton } from "@/shared/ui/skeleton";

const SKELETON_KEYS = ["a", "b", "c", "d", "e", "f"] as const;

export function ArticleGridSkeleton() {
  return (
    <div role="status" aria-label="Loading articles">
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SKELETON_KEYS.map((key) => (
          <li
            key={key}
            className="flex flex-col overflow-hidden rounded-xl border"
          >
            <Skeleton className="aspect-video rounded-none" />
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

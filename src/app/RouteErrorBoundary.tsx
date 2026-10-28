import { useEffect } from "react";
import { useRouteError } from "react-router";
import { Button } from "@/shared/ui/button";

// App-level error boundary (router `errorElement`). The only place allowed to console.error.
export function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">
        An unexpected error occurred. Reloading the page usually fixes it.
      </p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </main>
  );
}

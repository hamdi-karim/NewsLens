import { useEffect } from "react";
import { useRouteError } from "react-router";
import { Button } from "@/shared/ui/button";

// Router `errorElement` for the pages and the layout. The only place allowed to console.error.
export function RouteErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">
        An unexpected error occurred. Reloading the page usually fixes it.
      </p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </section>
  );
}

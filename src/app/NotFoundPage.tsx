import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="text-sm font-medium underline underline-offset-4">
        Back to your feed
      </Link>
    </section>
  );
}

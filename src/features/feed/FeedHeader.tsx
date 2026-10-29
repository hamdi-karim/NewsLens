import { Sparkles } from "lucide-react";
import { Link } from "react-router";
import type { Preferences } from "@/domain/types";
import { Button } from "@/shared/ui/button";
import { describePreferences, getGreeting, hasPreferences } from "./feedText";

interface FeedHeaderProps {
  preferences: Preferences;
}

// Greeting + what the feed is built from, or a nudge to personalize it.
export function FeedHeader({ preferences }: FeedHeaderProps) {
  const greeting = getGreeting(new Date());

  return (
    <header className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
      {hasPreferences(preferences) ? (
        <p className="text-sm text-muted-foreground">
          {describePreferences(preferences)} ·{" "}
          <Link
            to="/preferences"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Edit preferences
          </Link>
        </p>
      ) : (
        <section
          aria-labelledby="personalize-heading"
          className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:items-center"
        >
          <Sparkles
            aria-hidden="true"
            className="size-6 shrink-0 text-primary"
          />
          <div className="flex-1">
            <h2 id="personalize-heading" className="font-semibold">
              Personalize your feed
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick your favorite sources, topics and writers. Until then, here
              is the latest from every source.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit">
            <Link to="/preferences">Set preferences</Link>
          </Button>
        </section>
      )}
    </header>
  );
}

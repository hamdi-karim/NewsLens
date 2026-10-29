import { Link } from "react-router";
import { ArticleResults } from "@/features/articles";
import { Button } from "@/shared/ui/button";
import { FeedHeader } from "./FeedHeader";
import { useFeedQuery } from "./useFeedQuery";

export function ForYouPage() {
  const { query, preferences } = useFeedQuery();

  return (
    <div className="flex flex-col gap-6">
      <FeedHeader preferences={preferences} />
      <section aria-label="Your articles">
        <ArticleResults
          query={query}
          followedAuthors={preferences.authors}
          emptyState={{
            title: "No articles match your preferences",
            description: "Try more categories or sources.",
            action: (
              <Button asChild variant="outline">
                <Link to="/preferences">Edit preferences</Link>
              </Button>
            ),
          }}
        />
      </section>
    </div>
  );
}

import { formatDistanceToNow } from "date-fns";
import { Newspaper } from "lucide-react";
import { useState } from "react";
import type { Article } from "@/domain/types";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { getSourceDisplay } from "./sourceConfig";

interface ArticleCardProps {
  article: Article;
  // The lead story: wider (side by side from md), larger title, "Top story" label.
  isFeatured?: boolean;
}

export function ArticleCard({ article, isFeatured = false }: ArticleCardProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const source = getSourceDisplay(article.source);
  const sourceText = article.publisher
    ? `${source.label} · ${article.publisher}`
    : source.label;
  const relativeDate = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });
  const showImage = Boolean(article.imageUrl) && !hasImageError;

  return (
    // The title link's ::after covers the card, so the whole card is clickable with one link.
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50",
        isFeatured && "md:flex-row",
      )}
    >
      <div
        className={cn(
          "aspect-video bg-muted",
          isFeatured && "md:aspect-auto md:min-h-64 md:w-1/2 md:shrink-0",
        )}
      >
        {showImage ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            onError={() => setHasImageError(true)}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Newspaper aria-hidden="true" className="size-8" />
          </div>
        )}
      </div>

      <div
        className={cn("flex flex-1 flex-col gap-2 p-4", isFeatured && "md:p-6")}
      >
        {isFeatured && (
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Top story
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge className={cn("max-w-full truncate", source.badgeClassName)}>
            {sourceText}
          </Badge>
          {article.category && (
            <span className="capitalize">{article.category}</span>
          )}
        </div>

        <h2
          className={cn(
            "leading-snug font-semibold",
            isFeatured ? "text-xl md:text-2xl" : "text-base",
          )}
        >
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="outline-none after:absolute after:inset-0 hover:underline"
          >
            {article.title}{" "}
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </h2>

        {article.description && (
          <p
            className={cn(
              "text-sm text-muted-foreground",
              isFeatured ? "line-clamp-4 md:text-base" : "line-clamp-3",
            )}
          >
            {article.description}
          </p>
        )}

        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          {article.author && <span>{article.author} · </span>}
          <time dateTime={article.publishedAt}>{relativeDate}</time>
        </p>
      </div>
    </article>
  );
}

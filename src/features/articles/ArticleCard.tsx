import { formatDistanceToNow } from "date-fns";
import { Newspaper, Zap } from "lucide-react";
import { useState } from "react";
import type { Article } from "@/domain/types";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { getSourceDisplay } from "./sourceConfig";

interface ArticleCardProps {
  article: Article;
  // The lead story: full row, side by side from md, larger type, "Top story" label.
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
        isFeatured && "border-primary/30 bg-muted/40 shadow-sm md:flex-row",
      )}
    >
      {/* Fixed-size box; the image is absolutely positioned, so its natural size never sets the card's height. */}
      <div
        className={cn(
          "relative aspect-video shrink-0 bg-muted",
          isFeatured && "md:aspect-auto md:min-h-80 md:w-1/2",
        )}
      >
        {showImage ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            loading={isFeatured ? "eager" : "lazy"}
            onError={() => setHasImageError(true)}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Newspaper aria-hidden="true" className="size-8" />
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col gap-2 p-4",
          isFeatured && "gap-3 md:justify-center md:p-8",
        )}
      >
        {isFeatured && (
          <p className="inline-flex w-fit items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold tracking-wide text-primary-foreground uppercase">
            <Zap aria-hidden="true" className="size-3.5" />
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
            // Regular cards clamp and reserve 2 lines, so every card lines up.
            isFeatured
              ? "line-clamp-4 text-2xl font-bold tracking-tight lg:text-3xl"
              : "line-clamp-2 min-h-[2lh] text-base",
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

        {/* Rendered even when empty on regular cards, to keep the reserved space. */}
        {(article.description || !isFeatured) && (
          <p
            className={cn(
              "text-muted-foreground",
              isFeatured
                ? "line-clamp-4 text-base md:text-lg"
                : "line-clamp-3 min-h-[3lh] text-sm",
            )}
          >
            {article.description}
          </p>
        )}

        {/* One line: some bylines list a dozen authors, which would stretch the whole row. */}
        <p
          className={cn(
            "flex min-w-0 gap-1 text-xs text-muted-foreground",
            isFeatured ? "pt-1 md:text-sm" : "mt-auto pt-2",
          )}
        >
          {article.author && (
            <>
              <span className="min-w-0 truncate" title={article.author}>
                {article.author}
              </span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <time dateTime={article.publishedAt} className="shrink-0">
            {relativeDate}
          </time>
        </p>
      </div>
    </article>
  );
}

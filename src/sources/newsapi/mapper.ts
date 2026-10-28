import type { Article, Category } from "@/domain/types";
import { toHttpUrl, toIsoDate, toPlainText } from "@/shared/lib/sanitize";
import type { NewsApiArticle } from "./types";

// Placeholder NewsAPI returns for articles taken down by the publisher.
const REMOVED = "[Removed]";

export function mapNewsApiArticle(
  item: NewsApiArticle,
  category?: Category,
): Article | undefined {
  const title = item.title?.trim();
  const url = toHttpUrl(item.url);
  const publishedAt = toIsoDate(item.publishedAt);
  if (!title || title === REMOVED || !url || !publishedAt) return undefined;

  return {
    // NewsAPI has no article id; the URL is the stable identifier.
    id: `newsapi:${url}`,
    source: "newsapi",
    title,
    description: toPlainText(item.description),
    url,
    imageUrl: toHttpUrl(item.urlToImage),
    author: item.author?.trim() || undefined,
    publisher: item.source?.name?.trim() || undefined,
    category,
    publishedAt,
  };
}

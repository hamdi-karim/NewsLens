import type { Article } from "@/domain/types";
import { toHttpUrl, toIsoDate } from "@/shared/lib/sanitize";
import { nytCategoryOf } from "./categories";
import type { NytDoc } from "./types";

// "By Jane Doe and John Roe" → "Jane Doe and John Roe"
function toAuthor(byline: string | null | undefined): string | undefined {
  return byline?.replace(/^by\s+/i, "").trim() || undefined;
}

export function mapNytDoc(doc: NytDoc): Article | undefined {
  const title = doc.headline?.main?.trim();
  const url = toHttpUrl(doc.web_url);
  const publishedAt = toIsoDate(doc.pub_date);
  if (!doc._id || !title || !url || !publishedAt) return undefined;

  return {
    id: `nyt:${doc._id}`,
    source: "nyt",
    title,
    description: doc.abstract?.trim() || doc.snippet?.trim() || undefined,
    url,
    imageUrl: toHttpUrl(
      doc.multimedia?.default?.url ?? doc.multimedia?.thumbnail?.url,
    ),
    author: toAuthor(doc.byline?.original),
    category: nytCategoryOf(doc.section_name),
    publishedAt,
  };
}

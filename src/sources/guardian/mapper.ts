import type { Article } from "@/domain/types";
import { toHttpUrl, toIsoDate, toPlainText } from "@/shared/lib/sanitize";
import { guardianCategoryOf } from "./categories";
import type { GuardianResult } from "./types";

export function mapGuardianResult(result: GuardianResult): Article | undefined {
  const title = result.webTitle?.trim();
  const url = toHttpUrl(result.webUrl);
  const publishedAt = toIsoDate(result.webPublicationDate);
  if (!result.id || !title || !url || !publishedAt) return undefined;

  return {
    id: `guardian:${result.id}`,
    source: "guardian",
    title,
    description: toPlainText(result.fields?.trailText),
    url,
    imageUrl: toHttpUrl(result.fields?.thumbnail),
    author: result.fields?.byline?.trim() || undefined,
    category: guardianCategoryOf(result.sectionId),
    publishedAt,
  };
}

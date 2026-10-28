import {
  DEFAULT_PAGE_SIZE,
  type ArticleQuery,
  type NewsSource,
} from "@/domain/types";
import { getJson, type QueryParams } from "@/shared/lib/http";
import { sectionsFor } from "../categoryLookup";
import { GUARDIAN_SECTIONS } from "./categories";
import { mapGuardianResult } from "./mapper";
import type { GuardianResponse } from "./types";

export function buildGuardianParams(query: ArticleQuery): QueryParams {
  return {
    q: query.keyword,
    "from-date": query.from,
    "to-date": query.to,
    // "|" is OR in the Guardian API.
    section: sectionsFor(GUARDIAN_SECTIONS, query.categories).join("|"),
    page: query.page,
    "page-size": DEFAULT_PAGE_SIZE,
    "order-by": query.sort, // the API's values match ours: "newest" | "relevance"
    "show-fields": "trailText,thumbnail,byline",
  };
}

export const guardianSource: NewsSource = {
  id: "guardian",
  label: "The Guardian",
  capabilities: {
    keyword: true,
    dateRange: true,
    category: true,
    author: false,
  },

  async search(query, signal) {
    const data = await getJson<GuardianResponse>(
      "/api/guardian/search",
      buildGuardianParams(query),
      signal,
    );
    const { results, currentPage = 0, pages = 0 } = data.response ?? {};

    return {
      articles: (results ?? []).flatMap(
        (result) => mapGuardianResult(result) ?? [],
      ),
      hasMore: currentPage < pages,
    };
  },
};

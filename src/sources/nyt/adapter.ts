import type { ArticleQuery, NewsSource } from "@/domain/types";
import { getJson, type QueryParams } from "@/shared/lib/http";
import { sectionsFor } from "../categoryLookup";
import { NYT_SECTIONS } from "./categories";
import { mapNytDoc } from "./mapper";
import type { NytResponse } from "./types";

// Fixed by the API.
const NYT_PAGE_SIZE = 10;
// The API serves pages 0–100 only.
const NYT_MAX_PAGE = 100;

// YYYY-MM-DD → YYYYMMDD
function toNytDate(date: string | undefined): string | undefined {
  return date?.replaceAll("-", "");
}

// Lucene filter, OR over the values: section.name:("World" "Business").
// Note: the old `section_name` field silently matches nothing.
function toSectionFilter(sections: string[]): string | undefined {
  if (sections.length === 0) return undefined;
  return `section.name:(${sections.map((section) => `"${section}"`).join(" ")})`;
}

export function buildNytParams(query: ArticleQuery): QueryParams {
  return {
    q: query.keyword,
    begin_date: toNytDate(query.from),
    end_date: toNytDate(query.to),
    fq: toSectionFilter(sectionsFor(NYT_SECTIONS, query.categories)),
    page: query.page - 1, // NYT pages are 0-based
    sort: query.sort, // the API's values match ours: "newest" | "relevance"
  };
}

export const nytSource: NewsSource = {
  id: "nyt",
  label: "New York Times",
  capabilities: {
    keyword: true,
    dateRange: true,
    category: true,
    author: false,
  },

  async search(query, signal) {
    const data = await getJson<NytResponse>(
      "/api/nyt/articlesearch.json",
      buildNytParams(query),
      signal,
    );
    const docs = data.response?.docs ?? [];
    const hits = data.response?.metadata?.hits ?? 0;

    return {
      articles: docs.flatMap((doc) => mapNytDoc(doc) ?? []),
      // The next page's 0-based index is `query.page`.
      hasMore: query.page * NYT_PAGE_SIZE < hits && query.page <= NYT_MAX_PAGE,
    };
  },
};

import { UnsupportedQueryError } from "@/domain/errors";
import {
  DEFAULT_PAGE_SIZE,
  type ArticleQuery,
  type Category,
  type NewsSource,
} from "@/domain/types";
import { getJson, type QueryParams } from "@/shared/lib/http";
import { newsApiCategoryCalls } from "./categories";
import { mapNewsApiArticle } from "./mapper";
import type { NewsApiResponse } from "./types";

const EVERYTHING = "/api/newsapi/everything";
const TOP_HEADLINES = "/api/newsapi/top-headlines";

// Developer (free) plan limits.
const MAX_RESULTS = 100;
const MAX_AGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface NewsApiRequest {
  path: string;
  params: QueryParams;
  category?: Category; // app category given to every article of this call
}

function isOutsidePlanWindow(from: string | undefined): boolean {
  if (!from) return false;
  return Date.parse(from) < Date.now() - MAX_AGE_DAYS * DAY_MS;
}

// Endpoint rule (overview §4): `/everything` needs a keyword and has no category;
// `/top-headlines` takes one category per call and has no date range.
export function buildNewsApiRequests(query: ArticleQuery): NewsApiRequest[] {
  const paging = { page: query.page, pageSize: DEFAULT_PAGE_SIZE };

  if (query.keyword && query.categories.length === 0) {
    return [
      {
        path: EVERYTHING,
        params: {
          q: query.keyword,
          from: query.from,
          to: query.to,
          sortBy: query.sort === "relevance" ? "relevancy" : "publishedAt",
          language: "en",
          ...paging,
        },
      },
    ];
  }

  const params = { country: "us", q: query.keyword, ...paging };
  const calls = newsApiCategoryCalls(query.categories);
  if (calls.length === 0) return [{ path: TOP_HEADLINES, params }];

  return calls.map(({ category, appCategory }) => ({
    path: TOP_HEADLINES,
    params: { ...params, category },
    category: appCategory,
  }));
}

export const newsApiSource: NewsSource = {
  id: "newsapi",
  label: "NewsAPI",
  // Dates are filtered server-side only on `/everything`, so the aggregator re-applies
  // them (a no-op there). A category always routes to `/top-headlines`, which filters it.
  capabilities: {
    keyword: true,
    dateRange: false,
    category: true,
    author: false,
  },

  async search(query, signal) {
    // Checked before any request: the free plan can't serve it, so don't spend quota.
    if (isOutsidePlanWindow(query.from)) {
      throw new UnsupportedQueryError(
        `NewsAPI only covers the last ${MAX_AGE_DAYS} days`,
      );
    }

    const requests = buildNewsApiRequests(query);
    // Any failing call fails the whole source: a partial NewsAPI page would be misleading.
    const responses = await Promise.all(
      requests.map((request) =>
        getJson<NewsApiResponse>(request.path, request.params, signal),
      ),
    );

    return {
      articles: responses.flatMap((data, index) =>
        (data.articles ?? []).flatMap(
          (item) => mapNewsApiArticle(item, requests[index]?.category) ?? [],
        ),
      ),
      hasMore: responses.some(
        (data) =>
          query.page * DEFAULT_PAGE_SIZE <
          Math.min(data.totalResults ?? 0, MAX_RESULTS),
      ),
    };
  },
};

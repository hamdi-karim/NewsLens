export const SOURCE_IDS = ["guardian", "nyt", "newsapi"] as const;
export type SourceId = (typeof SOURCE_IDS)[number];

export const CATEGORIES = [
  "world",
  "business",
  "technology",
  "science",
  "health",
  "sports",
  "culture",
  "politics",
] as const;
export type Category = (typeof CATEGORIES)[number];

// "relevance" only makes sense with a keyword; the caller decides which to use.
export const SORT_ORDERS = ["newest", "relevance"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

// Page size for sources that let us choose it (NYT is fixed at 10).
export const DEFAULT_PAGE_SIZE = 20;

export interface Article {
  id: string; // `${source}:${providerId}`, stable for keys and dedupe
  source: SourceId;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  author?: string;
  publisher?: string; // original outlet when the source is an aggregator (NewsAPI)
  category?: Category;
  publishedAt: string; // ISO string; formatted at the UI edge
}

export interface ArticleQuery {
  keyword?: string;
  from?: string; // inclusive calendar date, YYYY-MM-DD
  to?: string; // inclusive calendar date, YYYY-MM-DD
  categories: Category[];
  sources: SourceId[];
  authors: string[];
  sort: SortOrder;
  page: number; // 1-based
}

// What a source filters server-side; the aggregator applies the rest client-side.
export interface FilterCapabilities {
  keyword: boolean;
  dateRange: boolean;
  category: boolean;
  author: boolean;
}

export interface SourcePage {
  articles: Article[];
  hasMore: boolean;
}

export interface NewsSource {
  id: SourceId;
  label: string;
  capabilities: FilterCapabilities;
  // Throws UnsupportedQueryError when it can't serve the query at all.
  search(query: ArticleQuery, signal?: AbortSignal): Promise<SourcePage>;
}

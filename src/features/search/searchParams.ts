import { CATEGORIES, SOURCE_IDS, type ArticleQuery } from "@/domain/types";

// The URL is the single source of truth for search state. Lists use repeated keys
// (`?categories=world&categories=technology`), the format React Router's `setSearchParams` uses.
const PARAM = {
  keyword: "q",
  from: "from",
  to: "to",
  categories: "categories",
  sources: "sources",
} as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Never throws: invalid or unknown values fall back to defaults.
export function parseSearchParams(params: URLSearchParams): ArticleQuery {
  let from = parseDate(params.get(PARAM.from));
  let to = parseDate(params.get(PARAM.to));
  if (from && to && from > to) {
    from = undefined;
    to = undefined;
  }

  const sources = parseList(params.getAll(PARAM.sources), SOURCE_IDS);
  const keyword = params.get(PARAM.keyword)?.trim() || undefined;

  return {
    keyword,
    from,
    to,
    categories: parseList(params.getAll(PARAM.categories), CATEGORIES),
    sources: sources.length > 0 ? sources : [...SOURCE_IDS],
    authors: [],
    // Derived, not stored in the URL: relevance only means something with a keyword.
    sort: keyword ? "relevance" : "newest",
    page: 1,
  };
}

// Omits defaults (no keyword, no dates, all sources), so the default query is an empty string.
export function toSearchParams(query: ArticleQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.keyword?.trim()) params.set(PARAM.keyword, query.keyword.trim());
  if (query.from) params.set(PARAM.from, query.from);
  if (query.to) params.set(PARAM.to, query.to);
  for (const category of query.categories) {
    params.append(PARAM.categories, category);
  }
  if (query.sources.length < SOURCE_IDS.length) {
    for (const source of query.sources) params.append(PARAM.sources, source);
  }
  return params;
}

// For the mobile Filters badge: a date range counts once, each category once, and a
// narrowed source list once (it reads as one "sources" filter, however many are left).
export function countActiveFilters(query: ArticleQuery): number {
  return (
    (query.from || query.to ? 1 : 0) +
    query.categories.length +
    (query.sources.length < SOURCE_IDS.length ? 1 : 0)
  );
}

// True when any filter (not the keyword) differs from the defaults.
export function hasActiveFilters(query: ArticleQuery): boolean {
  return countActiveFilters(query) > 0;
}

function parseDate(value: string | null): string | undefined {
  if (!value || !DATE_PATTERN.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  // Rejects impossible dates like 2026-02-30, which Date would roll over.
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

// Keeps known values in their canonical order, so equivalent URLs share one cache entry.
function parseList<T extends string>(
  values: string[],
  allowed: readonly T[],
): T[] {
  return allowed.filter((item) => values.includes(item));
}

// Resets dates, categories, and sources; keeps the keyword.
export function clearFilters(query: ArticleQuery): ArticleQuery {
  return {
    ...query,
    from: undefined,
    to: undefined,
    categories: [],
    sources: [...SOURCE_IDS],
  };
}

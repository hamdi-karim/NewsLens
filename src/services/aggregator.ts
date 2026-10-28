import { UnsupportedQueryError } from "@/domain/errors";
import type {
  Article,
  ArticleQuery,
  FilterCapabilities,
  NewsSource,
  SortOrder,
  SourceId,
} from "@/domain/types";
import { SOURCES } from "@/sources/registry";

export interface SkippedSource {
  id: SourceId;
  reason: string;
}

export interface AggregatedPage {
  articles: Article[]; // filtered, deduped, sorted (this page only)
  failedSources: SourceId[]; // errored (network, 4xx/5xx, 429)
  skippedSources: SkippedSource[]; // UnsupportedQueryError
  sourcesWithMore: SourceId[]; // sources to call for the next page
}

// Thrown only when every called source failed, so TanStack Query shows the error state.
export class AllSourcesFailedError extends Error {
  readonly failedSources: SourceId[];

  constructor(failedSources: SourceId[]) {
    super(`All sources failed: ${failedSources.join(", ")}`);
    this.name = "AllSourcesFailedError";
    this.failedSources = failedSources;
  }
}

// A source slower than this is aborted and reported as failed, so it can't hold up the page.
export const SOURCE_TIMEOUT_MS = 8000;

// Fans out to the sources in `query.sources`. One failing source never rejects the page.
export async function fetchArticles(
  query: ArticleQuery,
  signal?: AbortSignal,
  sources: readonly NewsSource[] = SOURCES,
): Promise<AggregatedPage> {
  const selected = sources.filter((source) =>
    query.sources.includes(source.id),
  );
  // Aborts on the caller's cancel (TanStack Query) or on the timeout, whichever comes first.
  const timeout = new AbortController();
  const timer = setTimeout(
    () => timeout.abort(new DOMException("Source timed out", "TimeoutError")),
    SOURCE_TIMEOUT_MS,
  );
  const sourceSignal = signal
    ? AbortSignal.any([signal, timeout.signal])
    : timeout.signal;

  // allSettled: waits for every source and keeps failures, so one error never loses the rest.
  const results = await Promise.allSettled(
    selected.map((source) => source.search(query, sourceSignal)),
  );
  clearTimeout(timer);

  const page: AggregatedPage = {
    articles: [],
    failedSources: [],
    skippedSources: [],
    sourcesWithMore: [],
  };
  const articles: Article[] = [];

  results.forEach((result, index) => {
    const source = selected[index];
    if (!source) return; // can't happen: one result per selected source
    if (result.status === "fulfilled") {
      articles.push(
        ...applyClientFilters(
          result.value.articles,
          query,
          source.capabilities,
        ),
      );
      if (result.value.hasMore) page.sourcesWithMore.push(source.id);
    } else if (result.reason instanceof UnsupportedQueryError) {
      page.skippedSources.push({
        id: source.id,
        reason: result.reason.message,
      });
    } else {
      page.failedSources.push(source.id);
    }
  });

  const hasAnySuccess = results.some((result) => result.status === "fulfilled");
  if (!hasAnySuccess && page.failedSources.length > 0) {
    throw new AllSourcesFailedError(page.failedSources);
  }

  page.articles = mergeArticles(articles, query.sort, sources);
  return page;
}

// Applies only the filters the source couldn't apply server-side.
function applyClientFilters(
  articles: Article[],
  query: ArticleQuery,
  capabilities: FilterCapabilities,
): Article[] {
  const keyword = query.keyword?.toLowerCase();

  return articles.filter((article) => {
    if (!capabilities.keyword && keyword) {
      const text = `${article.title} ${article.description ?? ""}`;
      if (!text.toLowerCase().includes(keyword)) return false;
    }
    if (!capabilities.dateRange) {
      const day = article.publishedAt.slice(0, 10); // UTC calendar date
      if (query.from && day < query.from) return false;
      if (query.to && day > query.to) return false;
    }
    if (!capabilities.category && query.categories.length > 0) {
      if (!article.category || !query.categories.includes(article.category)) {
        return false;
      }
    }
    // Authors are never filtered: they boost the feed instead (Spec 04).
    return true;
  });
}

// Dedupes by normalized URL (the source listed first in `sources` wins), then orders by `sort`.
// `articles` must keep each source's own order (its relevance ranking).
export function mergeArticles(
  articles: Article[],
  sort: SortOrder,
  sources: readonly NewsSource[] = SOURCES,
): Article[] {
  const priority = (article: Article) =>
    sources.findIndex((source) => source.id === article.source);
  // Stable sort: each source's own order is kept.
  const byPriority = [...articles].sort((a, b) => priority(a) - priority(b));

  const seen = new Set<string>();
  const unique = byPriority.filter((article) => {
    const key = normalizeUrl(article.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (sort === "newest") {
    return unique.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  // Relevance scores aren't comparable across providers, so interleave by rank:
  // every source's #1 (in priority order), then every #2, and so on.
  const ranks = new Map<SourceId, number>();
  const ranked = unique.map((article) => {
    const rank = ranks.get(article.source) ?? 0;
    ranks.set(article.source, rank + 1);
    return { article, rank };
  });
  return ranked
    .sort(
      (a, b) => a.rank - b.rank || priority(a.article) - priority(b.article),
    )
    .map(({ article }) => article);
}

// Host (lowercased by URL) + path, without protocol, query string, hash, or trailing slash.
export function normalizeUrl(url: string): string {
  try {
    const { host, pathname } = new URL(url);
    return `${host}${pathname.replace(/\/+$/, "")}`;
  } catch {
    return url;
  }
}

import type { NewsSource } from "@/domain/types";
import { guardianSource } from "./guardian/adapter";
import { newsApiSource } from "./newsapi/adapter";
import { nytSource } from "./nyt/adapter";

// Enabled sources. Order is the dedupe priority: when two sources return the same
// article, the one listed first wins (native publishers before the aggregator).
export const SOURCES: readonly NewsSource[] = [
  guardianSource,
  nytSource,
  newsApiSource,
];

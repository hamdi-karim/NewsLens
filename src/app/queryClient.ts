import { QueryClient } from "@tanstack/react-query";
import { AllSourcesFailedError } from "@/services/aggregator";
import { RateLimitError } from "@/shared/lib/http";

const FIVE_MINUTES = 5 * 60 * 1000;

// Retry once, except for errors where retrying only burns more quota: a 429, or every
// source failing (a retry would call all of them again; the user has a Retry button).
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof RateLimitError) return false;
  if (error instanceof AllSourcesFailedError) return false;
  return failureCount < 1;
}

// Conservative defaults to protect the news APIs' rate limits.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES,
        refetchOnWindowFocus: false,
        // A reconnect would refetch every loaded page; the Retry button covers recovery.
        refetchOnReconnect: false,
        retry: shouldRetry,
      },
    },
  });
}

import { QueryClient } from "@tanstack/react-query";

const FIVE_MINUTES = 5 * 60 * 1000;

// Conservative defaults to protect the news APIs' rate limits.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

interface ProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

// App-wide providers, router excluded so tests can pair them with a memory router.
export function Providers({ queryClient, children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

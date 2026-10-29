import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { PreferencesStore } from "@/domain/types";
import { PreferencesStoreContext } from "@/features/preferences";

interface ProvidersProps {
  queryClient: QueryClient;
  preferencesStore: PreferencesStore;
  children: ReactNode;
}

// App-wide providers, router excluded so tests can pair them with a memory router.
// Dependencies come in as props, so tests inject their own (DIP).
export function Providers({
  queryClient,
  preferencesStore,
  children,
}: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesStoreContext value={preferencesStore}>
        {children}
      </PreferencesStoreContext>
    </QueryClientProvider>
  );
}

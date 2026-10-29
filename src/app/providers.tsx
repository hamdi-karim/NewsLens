import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { PreferencesStore } from "@/domain/types";
import { PreferencesStoreContext } from "@/features/preferences";
import { useTheme } from "@/features/theme";
import { Toaster } from "@/shared/ui/sonner";

interface ProvidersProps {
  queryClient: QueryClient;
  preferencesStore: PreferencesStore;
  children: ReactNode;
}

// Its own component, so a theme change re-renders only the toaster.
function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} />;
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
        <ThemedToaster />
      </PreferencesStoreContext>
    </QueryClientProvider>
  );
}

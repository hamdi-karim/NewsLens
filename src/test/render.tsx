import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Providers } from "@/app/providers";
import { createQueryClient } from "@/app/queryClient";
import { createRoutes } from "@/app/routes";
import { EMPTY_PREFERENCES, type Preferences } from "@/domain/types";
import { createMemoryPreferencesStore } from "./preferencesStore";

interface RenderRouteOptions {
  preferences?: Preferences;
}

// Renders the real app routes at `path`, with a fresh QueryClient and preferences store per test.
export function renderRoute(
  path: string,
  { preferences = EMPTY_PREFERENCES }: RenderRouteOptions = {},
) {
  const queryClient = createQueryClient();
  // setDefaultOptions replaces, so merge to keep the app's caching (staleTime etc.).
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaults,
    queries: { ...defaults.queries, retry: false },
  });
  const preferencesStore = createMemoryPreferencesStore(preferences);
  const router = createMemoryRouter(createRoutes(), { initialEntries: [path] });

  return {
    router,
    queryClient,
    preferencesStore,
    ...render(
      <Providers queryClient={queryClient} preferencesStore={preferencesStore}>
        <RouterProvider router={router} />
      </Providers>,
    ),
  };
}

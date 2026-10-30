import type { RouteObject } from "react-router";
import { ForYouPage } from "@/features/feed";
import { PreferencesPage } from "@/features/preferences";
import { AppLayout } from "./AppLayout";
import { NotFoundPage } from "./NotFoundPage";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

// Used by the browser router (app) and the memory router (tests). A factory, because
// React Router keeps lazy-route state on the route objects: a second router built
// from the same objects (the next test) can't match the lazy route.
export const createRoutes = (): RouteObject[] => [
  {
    element: <AppLayout />,
    // Only if the layout itself fails; it has no <main> around it then.
    errorElement: (
      <main>
        <RouteErrorBoundary />
      </main>
    ),
    children: [
      {
        // A page error renders inside the layout, so the header and nav keep working.
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <ForYouPage /> },
          {
            path: "search",
            // Only /search is split: the header already needs the preferences form and
            // Radix on every page, so splitting the other routes would save ~1 kB.
            // The router loads the chunk before navigating, so there's no Suspense fallback.
            lazy: {
              Component: async () =>
                (await import("@/features/search/pages")).SearchPage,
            },
          },
          { path: "preferences", element: <PreferencesPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

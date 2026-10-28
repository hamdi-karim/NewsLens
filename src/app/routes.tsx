import type { RouteObject } from "react-router";
import { ForYouPage } from "@/features/feed";
import { PreferencesPage } from "@/features/preferences";
import { SearchPage } from "@/features/search";
import { AppLayout } from "./AppLayout";
import { NotFoundPage } from "./NotFoundPage";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

// Shared by the browser router (app) and the memory router (tests).
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <ForYouPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "preferences", element: <PreferencesPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

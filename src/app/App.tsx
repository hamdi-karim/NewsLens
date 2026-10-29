import { RouterProvider } from "react-router";
import { createLocalPreferencesStore } from "@/features/preferences";
import { Providers } from "./providers";
import { createQueryClient } from "./queryClient";
import { router } from "./router";

const queryClient = createQueryClient();
// The one place that picks localStorage; swap this line for an accounts API.
const preferencesStore = createLocalPreferencesStore();

export function App() {
  return (
    <Providers queryClient={queryClient} preferencesStore={preferencesStore}>
      <RouterProvider router={router} />
    </Providers>
  );
}

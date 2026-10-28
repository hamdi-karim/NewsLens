import { fileURLToPath, URL } from "node:url";
import type { ClientRequest } from "node:http";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv, type ProxyOptions } from "vite";
import { defineConfig } from "vitest/config";

const API_KEY_NAMES = [
  "GUARDIAN_API_KEY",
  "NYT_API_KEY",
  "NEWSAPI_API_KEY",
] as const;

// Same treatment as the Nginx proxy: the providers never see the user's cookies or our origin.
function stripBrowserHeaders(proxyReq: ClientRequest): void {
  proxyReq.removeHeader("cookie");
  proxyReq.removeHeader("origin");
  proxyReq.removeHeader("referer");
}

// `path` includes the query string, so the key is added to whatever the browser sent.
function withApiKey(path: string, key: string): string {
  const url = new URL(path, "http://proxy.local");
  url.searchParams.set("api-key", key);
  return url.pathname + url.search;
}

// Mirrors docker/nginx/default.conf.template. Keys are read server-side only and never
// reach client code (nothing here is passed to `define` or prefixed with VITE_).
function apiProxy(env: Record<string, string>): Record<string, ProxyOptions> {
  const configure: ProxyOptions["configure"] = (proxy) => {
    proxy.on("proxyReq", stripBrowserHeaders);
  };

  return {
    "^/api/guardian/search(\\?|$)": {
      target: "https://content.guardianapis.com",
      changeOrigin: true,
      rewrite: (path) =>
        withApiKey(
          path.replace(/^\/api\/guardian/, ""),
          env.GUARDIAN_API_KEY ?? "",
        ),
      configure,
    },
    "^/api/nyt/articlesearch\\.json(\\?|$)": {
      target: "https://api.nytimes.com",
      changeOrigin: true,
      rewrite: (path) =>
        withApiKey(
          path.replace(/^\/api\/nyt/, "/svc/search/v2"),
          env.NYT_API_KEY ?? "",
        ),
      configure,
    },
    "^/api/newsapi/(everything|top-headlines)(\\?|$)": {
      target: "https://newsapi.org",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/newsapi/, "/v2"),
      headers: {
        "X-Api-Key": env.NEWSAPI_API_KEY ?? "",
        "User-Agent": "NewsLens/1.0",
      },
      configure,
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (command === "serve" && mode !== "test") {
    const missing = API_KEY_NAMES.filter((name) => !env[name]);
    if (missing.length > 0) {
      console.warn(
        `[api proxy] Missing in .env: ${missing.join(", ")}. Those sources will return 401.`,
      );
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: { proxy: apiProxy(env) },
    test: {
      environment: "jsdom",
      globals: false,
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});

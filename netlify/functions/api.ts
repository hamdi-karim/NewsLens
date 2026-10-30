// Netlify's replacement for the Nginx proxy (docker/nginx/default.conf.template). The
// browser only calls same-origin /api/*; the keys are added here, server-side, from the
// site's environment variables. Same allowlist as Nginx and the Vite dev proxy.

type ApiKeyName = "GUARDIAN_API_KEY" | "NYT_API_KEY" | "NEWSAPI_API_KEY";
type ApiKeys = Partial<Record<ApiKeyName, string>>;

interface Upstream {
  url: string;
  headers: Record<string, string>;
}

// `null` means the path is not ours to proxy: the caller answers 404.
export function toUpstream(requestUrl: URL, env: ApiKeys): Upstream | null {
  const { pathname, search } = requestUrl;

  if (pathname === "/api/guardian/search") {
    return withApiKey(
      `https://content.guardianapis.com/search${search}`,
      env.GUARDIAN_API_KEY,
    );
  }

  if (pathname === "/api/nyt/articlesearch.json") {
    return withApiKey(
      `https://api.nytimes.com/svc/search/v2/articlesearch.json${search}`,
      env.NYT_API_KEY,
    );
  }

  const newsApi = /^\/api\/newsapi\/(everything|top-headlines)$/.exec(pathname);
  if (newsApi) {
    return {
      url: `https://newsapi.org/v2/${newsApi[1]}${search}`,
      headers: {
        "X-Api-Key": env.NEWSAPI_API_KEY ?? "",
        "User-Agent": "NewsLens/1.0",
      },
    };
  }

  return null;
}

// `set`, not `append`: a client-supplied api-key is replaced by ours.
function withApiKey(url: string, key: string | undefined): Upstream {
  const upstream = new URL(url);
  upstream.searchParams.set("api-key", key ?? "");
  return { url: upstream.toString(), headers: {} };
}

export async function handle(
  req: Request,
  env: ApiKeys,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const upstream =
    req.method === "GET" ? toUpstream(new URL(req.url), env) : null;
  if (!upstream) return new Response("Not found", { status: 404 });

  // Only our headers go upstream: never the browser's cookies, origin, or referer.
  const response = await fetchImpl(upstream.url, { headers: upstream.headers });

  // Status passes through unchanged, so a 429 still reaches the app as a rate limit.
  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  return new Response(response.body, { status: response.status, headers });
}

export default (req: Request): Promise<Response> =>
  handle(req, process.env, fetch);

export const config = { path: "/api/*" };

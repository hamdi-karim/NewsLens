import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "@/app/queryClient";
import { SOURCE_IDS } from "@/domain/types";
import guardianSearch from "@/test/fixtures/guardian/search.json";
import { makeQuery } from "@/test/query";
import { server } from "@/test/server";
import { useArticleSearch } from "./useArticleSearch";

function renderSearch(...args: Parameters<typeof useArticleSearch>) {
  const queryClient = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useArticleSearch(...args), { wrapper });
}

// Pathnames of every request MSW sees during the test.
function recordRequestPaths(): string[] {
  const paths: string[] = [];
  server.events.on("request:start", ({ request }) => {
    paths.push(new URL(request.url).pathname);
  });
  return paths;
}

const ALL = [...SOURCE_IDS];

describe("useArticleSearch", () => {
  afterEach(() => server.events.removeAllListeners());

  it("merges the first page from every selected source (real adapters + MSW)", async () => {
    const { result } = renderSearch(makeQuery({ keyword: "ai", sources: ALL }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const articles = result.current.data?.articles ?? [];
    expect(articles).toHaveLength(15);
    expect(new Set(articles.map((a) => a.source))).toEqual(new Set(ALL));
    expect(result.current.hasNextPage).toBe(false);
  });

  it("reports a failing source and keeps the others", async () => {
    server.use(
      http.get("/api/nyt/articlesearch.json", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    const { result } = renderSearch(makeQuery({ keyword: "ai", sources: ALL }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.failedSources).toEqual(["nyt"]);
    expect(result.current.data?.articles).toHaveLength(10);
  });

  it("errors without retrying when every source fails", async () => {
    const onRequest = vi.fn();
    server.use(
      http.get("/api/guardian/search", () => {
        onRequest();
        return HttpResponse.json({}, { status: 429 });
      }),
    );

    const { result } = renderSearch(
      makeQuery({ keyword: "ai", sources: ["guardian"] }),
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onRequest).toHaveBeenCalledOnce();
  });

  it("loads more only from sources that have more, merging all pages", async () => {
    const guardianPages: string[] = [];
    server.use(
      http.get("/api/guardian/search", ({ request }) => {
        const page = new URL(request.url).searchParams.get("page") ?? "1";
        guardianPages.push(page);
        const results = guardianSearch.response.results.map((item) => ({
          ...item,
          id: `${item.id}-p${page}`,
          webUrl: `${item.webUrl}-p${page}`,
        }));
        return HttpResponse.json({
          response: {
            ...guardianSearch.response,
            currentPage: Number(page),
            pages: 2,
            results,
          },
        });
      }),
    );
    const paths = recordRequestPaths();

    const { result } = renderSearch(makeQuery({ keyword: "ai", sources: ALL }));
    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    expect(result.current.data?.articles).toHaveLength(15);

    await act(() => result.current.fetchNextPage());

    await waitFor(() => expect(result.current.data?.articles).toHaveLength(20));
    expect(guardianPages).toEqual(["1", "2"]);
    expect(paths.filter((p) => p.includes("nyt"))).toHaveLength(1);
    expect(paths.filter((p) => p.includes("newsapi"))).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(false);
  });
});

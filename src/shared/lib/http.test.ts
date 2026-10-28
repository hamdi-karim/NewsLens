import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { getJson, HttpError, RateLimitError } from "./http";

describe("getJson", () => {
  it("sends params, skipping empty ones, and parses JSON", async () => {
    let requestUrl: URL | undefined;
    server.use(
      http.get("/api/test", ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json({ ok: true });
      }),
    );

    const data = await getJson<{ ok: boolean }>("/api/test", {
      q: "climate change",
      page: 2,
      section: "",
      from: undefined,
    });

    expect(data).toEqual({ ok: true });
    expect(requestUrl?.pathname).toBe("/api/test");
    expect(Object.fromEntries(requestUrl?.searchParams ?? [])).toEqual({
      q: "climate change",
      page: "2",
    });
  });

  it("throws RateLimitError on 429", async () => {
    server.use(
      http.get("/api/test", () => new HttpResponse(null, { status: 429 })),
    );

    const error = await getJson("/api/test").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error).toMatchObject({ status: 429 });
  });

  it("throws HttpError with the status on other non-2xx responses", async () => {
    server.use(
      http.get("/api/test", () => new HttpResponse(null, { status: 500 })),
    );

    const error = await getJson("/api/test").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).not.toBeInstanceOf(RateLimitError);
    expect(error).toMatchObject({ status: 500 });
  });

  it("forwards the abort signal", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      getJson("/api/test", {}, controller.signal),
    ).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});

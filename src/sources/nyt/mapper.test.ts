import { describe, expect, it } from "vitest";
import fixture from "@/test/fixtures/nyt/articlesearch.json";
import { mapNytDoc } from "./mapper";
import type { NytDoc } from "./types";

const docs: NytDoc[] = fixture.response.docs;
const [briefing, arts, science] = docs;

describe("mapNytDoc", () => {
  it("maps a real doc to an Article", () => {
    expect(mapNytDoc(arts as NytDoc)).toMatchObject({
      id: "nyt:nyt://article/c6d0f8c6-f7e6-580d-aece-1c46c34b8cff",
      source: "nyt",
      author: "Thomas Rogers",
      category: "culture",
      publishedAt: "2026-10-28T09:00:17.000Z",
      url: expect.stringMatching(/^https:\/\/www\.nytimes\.com\//),
      imageUrl: expect.stringMatching(
        /^https:\/\/static01\.nyt\.com\/images\//,
      ),
    });
  });

  it("strips the leading 'By' from multi-author bylines", () => {
    expect(mapNytDoc(science as NytDoc)?.author).toBe(
      "Judson Jones, Chico Harlan and Raymond Zhong",
    );
  });

  it("has no category for sections outside the map", () => {
    expect(mapNytDoc(briefing as NytDoc)?.category).toBeUndefined();
  });

  it("falls back to the snippet, then the thumbnail", () => {
    const article = mapNytDoc({
      ...arts,
      abstract: "",
      snippet: "Snippet text",
      multimedia: { thumbnail: { url: "https://static01.nyt.com/thumb.jpg" } },
    });

    expect(article?.description).toBe("Snippet text");
    expect(article?.imageUrl).toBe("https://static01.nyt.com/thumb.jpg");
  });

  it("handles missing byline and multimedia", () => {
    const article = mapNytDoc({
      ...arts,
      byline: { original: null },
      multimedia: null,
    });

    expect(article?.author).toBeUndefined();
    expect(article?.imageUrl).toBeUndefined();
  });

  it.each([
    ["title", { headline: {} }],
    ["URL", { web_url: "/relative" }],
    ["date", { pub_date: undefined }],
  ])("drops docs without a valid %s", (_, override) => {
    expect(mapNytDoc({ ...arts, ...override })).toBeUndefined();
  });

  it("maps every fixture doc", () => {
    expect(docs.map(mapNytDoc).every(Boolean)).toBe(true);
  });
});

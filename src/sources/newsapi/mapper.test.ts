import { describe, expect, it } from "vitest";
import everything from "@/test/fixtures/newsapi/everything.json";
import topHeadlines from "@/test/fixtures/newsapi/top-headlines.json";
import { mapNewsApiArticle } from "./mapper";
import type { NewsApiArticle } from "./types";

const items: NewsApiArticle[] = everything.articles;
const [first] = items;
const withNulls: NewsApiArticle | undefined = topHeadlines.articles[3];

describe("mapNewsApiArticle", () => {
  it("maps a real article, using the URL as id and the outlet as publisher", () => {
    expect(mapNewsApiArticle(first as NewsApiArticle)).toEqual({
      id: "newsapi:https://soyacincau.com/2026/10/27/tesla-cybercab-malaysia-tour-location-schedule/",
      source: "newsapi",
      title:
        "Tesla Cybercab coming to Malaysia this week: Showcase tour confirmed",
      description: expect.stringMatching(
        /^The Tesla Cybercab will make its official debut/,
      ),
      url: "https://soyacincau.com/2026/10/27/tesla-cybercab-malaysia-tour-location-schedule/",
      imageUrl:
        "https://soyacincau.com/wp-content/uploads/2026/10/261027-tesla-cybercab-02.jpg",
      author: "Chief Chapree",
      publisher: "SoyaCincau.com",
      category: undefined,
      publishedAt: "2026-10-27T14:21:53.000Z",
    });
  });

  it("assigns the category of the call it came from", () => {
    expect(
      mapNewsApiArticle(first as NewsApiArticle, "business")?.category,
    ).toBe("business");
  });

  it("handles null author, description and image", () => {
    expect(mapNewsApiArticle(withNulls as NewsApiArticle)).toMatchObject({
      author: undefined,
      description: undefined,
      imageUrl: undefined,
      publisher: "BBC News",
    });
  });

  it("drops [Removed] placeholders", () => {
    const mapped = items.map((item) => mapNewsApiArticle(item));

    expect(mapped).toHaveLength(6);
    expect(mapped.filter(Boolean)).toHaveLength(5);
    expect(mapped.at(-1)).toBeUndefined();
  });

  it("drops articles without a valid URL", () => {
    expect(mapNewsApiArticle({ ...first, url: null })).toBeUndefined();
  });
});

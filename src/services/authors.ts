import type { Article } from "@/domain/types";

// "By Jane Doe, John Roe and Ann Lee" → ["Jane Doe", "John Roe", "Ann Lee"]
export function splitByline(byline: string): string[] {
  return byline
    .replace(/^by\s+/i, "")
    .split(/\s*(?:,|;|&|\band\b)\s*/i)
    .map((name) => name.trim())
    .filter(Boolean);
}

// Case-insensitive whole-word match: "Jane Doe" matches "By Jane Doe and John Roe",
// "Ali" doesn't match "Alice". Equality would miss multi-author bylines.
export function matchesAuthor(byline: string, name: string): boolean {
  const target = toWords(name);
  return target !== "" && ` ${toWords(byline)} `.includes(` ${target} `);
}

export interface BoostedArticles {
  articles: Article[];
  followedIds: Set<string>;
}

// Articles by followed authors first, then the rest; each group keeps its order.
// A boost, never a filter: providers can't search by author (overview §5B).
export function boostByAuthors(
  articles: Article[],
  authors: string[],
): BoostedArticles {
  const followedIds = new Set<string>();
  if (authors.length === 0) return { articles, followedIds };

  const followed: Article[] = [];
  const rest: Article[] = [];
  for (const article of articles) {
    const byline = article.author;
    if (byline && authors.some((name) => matchesAuthor(byline, name))) {
      followed.push(article);
      followedIds.add(article.id);
    } else {
      rest.push(article);
    }
  }
  return { articles: [...followed, ...rest], followedIds };
}

// Lowercase words separated by single spaces; punctuation dropped.
function toWords(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

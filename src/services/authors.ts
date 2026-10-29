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

// Bylines also carry job titles and affiliations ("Senior Lecturer, University of …"),
// so only 2–3 capitalized words count as a name. A heuristic, not name parsing.
const NAME_PATTERN = /^\p{Lu}[\p{L}'’.-]*(?: \p{Lu}[\p{L}'’.-]*){1,2}$/u;

// Names from loaded bylines, most frequent first (ties: first seen).
export function suggestAuthors(articles: Article[]): string[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const article of articles) {
    if (!article.author) continue;
    for (const name of splitByline(article.author)) {
      if (!NAME_PATTERN.test(name)) continue;
      const key = name.toLowerCase();
      const entry = counts.get(key) ?? { name, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  // Stable sort keeps first-seen order among equal counts.
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map((entry) => entry.name);
}

// Lowercase words separated by single spaces; punctuation dropped.
function toWords(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

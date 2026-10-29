import { CATEGORIES, SOURCE_IDS, type Preferences } from "@/domain/types";

export const MAX_AUTHORS = 20;
export const MAX_AUTHOR_LENGTH = 100;

// Stored values are user-editable and outlive app versions, so never trust them. Never throws.
export function sanitizePreferences(value: unknown): Preferences {
  const record = isRecord(value) ? value : {};
  return {
    sources: parseList(record.sources, SOURCE_IDS),
    categories: parseList(record.categories, CATEGORIES),
    authors: parseAuthors(record.authors),
  };
}

// Trims and collapses inner whitespace: " jane  doe " → "jane doe".
export function normalizeAuthor(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, MAX_AUTHOR_LENGTH);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Keeps known values in their canonical order, so equal preferences compare equal.
function parseList<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T[] {
  if (!Array.isArray(value)) return [];
  return allowed.filter((item) => value.includes(item));
}

// Deduped case-insensitively; the first spelling wins.
function parseAuthors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const authors: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const name = normalizeAuthor(item);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    authors.push(name);
  }
  return authors.slice(0, MAX_AUTHORS);
}

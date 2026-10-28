// Raw NewsAPI `/everything` and `/top-headlines` response (same shape). Every field is
// optional: the mapper checks what it reads. https://newsapi.org/docs

export interface NewsApiResponse {
  status?: string;
  totalResults?: number;
  articles?: NewsApiArticle[] | null;
}

export interface NewsApiArticle {
  source?: { id?: string | null; name?: string | null };
  author?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
}

// `/top-headlines` categories.
export type NewsApiCategory =
  | "business"
  | "entertainment"
  | "general"
  | "health"
  | "science"
  | "sports"
  | "technology";

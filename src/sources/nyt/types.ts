// Raw NYT Article Search v2 response. Every field is optional: the mapper checks what it
// reads. `docs` is `null` (not `[]`) when nothing matches.
// https://developer.nytimes.com/docs/articlesearch-product/1/overview

export interface NytResponse {
  status?: string;
  response?: {
    docs?: NytDoc[] | null;
    metadata?: {
      hits?: number;
      offset?: number;
    };
  };
}

export interface NytDoc {
  _id?: string;
  web_url?: string;
  headline?: { main?: string };
  abstract?: string;
  snippet?: string;
  byline?: { original?: string | null };
  pub_date?: string;
  section_name?: string;
  multimedia?: {
    default?: { url?: string };
    thumbnail?: { url?: string };
  } | null;
}

// Raw Guardian Content API `/search` response. Every field is optional: the mapper
// checks what it reads. https://open-platform.theguardian.com/documentation/search

export interface GuardianResponse {
  response?: {
    status?: string;
    currentPage?: number;
    pages?: number;
    results?: GuardianResult[];
  };
}

export interface GuardianResult {
  id?: string;
  sectionId?: string;
  webPublicationDate?: string;
  webTitle?: string;
  webUrl?: string;
  fields?: {
    trailText?: string;
    thumbnail?: string;
    byline?: string;
  };
}

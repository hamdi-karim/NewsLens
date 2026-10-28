export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

// 429: never retried, since retrying only burns more quota.
export class RateLimitError extends HttpError {
  constructor(message: string) {
    super(429, message);
    this.name = "RateLimitError";
  }
}

export type QueryParams = Record<string, string | number | undefined>;

// `T` is a trust boundary: callers describe the expected shape with optional fields
// and validate each field they read (see the source mappers).
export async function getJson<T>(
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    const message = `${response.status} ${response.statusText} (${url.pathname})`;
    throw response.status === 429
      ? new RateLimitError(message)
      : new HttpError(response.status, message);
  }
  return (await response.json()) as T;
}

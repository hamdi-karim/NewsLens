// HTML → plain text. DOMParser builds an inert document (no scripts run, no images load)
// and decodes entities, which a regex strip would not.
export function toPlainText(
  html: string | null | undefined,
): string | undefined {
  if (!html) return undefined;
  const text = new DOMParser().parseFromString(html, "text/html").body
    .textContent;
  return text.trim() || undefined;
}

// Only absolute http(s) URLs may reach an href or src (blocks `javascript:` links).
export function toHttpUrl(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}

// Any parseable date → ISO string; missing or invalid → undefined.
export function toIsoDate(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

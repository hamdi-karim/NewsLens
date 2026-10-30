import { Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Input } from "@/shared/ui/input";
import { parseSearchParams, toSearchParams } from "./searchParams";

const SEARCH_PATH = "/search";
// Short: this only limits URL writes. SearchPage debounces the results again (300 ms),
// so a request still waits for typing to pause ~450 ms in total.
const DEBOUNCE_MS = 150;

// Global keyword input. On /search it edits `q` in place (replace); elsewhere it
// navigates to /search once (push), so Back returns to the previous page.
export function SearchBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnSearch = location.pathname === SEARCH_PATH;
  const urlKeyword = isOnSearch
    ? (parseSearchParams(new URLSearchParams(location.search)).keyword ?? "")
    : "";

  const [draft, setDraft] = useState(urlKeyword);
  const debounced = useDebounce(draft, DEBOUNCE_MS);

  // URL → input, when the keyword changes from outside (Back, another link).
  // Adjusting state during render (React docs) instead of an effect. Skipped when the
  // URL only caught up with the draft, so a trailing space being typed isn't wiped.
  const [syncedKeyword, setSyncedKeyword] = useState(urlKeyword);
  if (urlKeyword !== syncedKeyword) {
    setSyncedKeyword(urlKeyword);
    if (urlKeyword !== draft.trim()) setDraft(urlKeyword);
  }

  const commit = useCallback(
    (value: string) => {
      const keyword = value.trim();
      if (keyword === urlKeyword) return;
      if (isOnSearch) {
        const query = parseSearchParams(new URLSearchParams(location.search));
        navigate(
          { search: toSearchParams({ ...query, keyword }).toString() },
          { replace: true },
        );
      } else if (keyword) {
        navigate({
          pathname: SEARCH_PATH,
          search: new URLSearchParams({ q: keyword }).toString(),
        });
      }
    },
    [isOnSearch, location.search, navigate, urlKeyword],
  );

  // Input → URL, once typing pauses. `debounced === draft` means the debounce has
  // settled; without it, a stale value would undo a Back navigation.
  useEffect(() => {
    if (debounced === draft) commit(debounced);
  }, [commit, debounced, draft]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    commit(draft); // Enter skips the debounce wait
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        aria-label="Search articles"
        placeholder="Search articles…"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        // Fetch the lazy /search route chunk early, so the first search doesn't wait for it.
        onFocus={() => void import("./pages")}
        className="h-9 pl-8"
      />
    </form>
  );
}

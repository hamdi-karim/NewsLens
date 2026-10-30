import { Plus, X } from "lucide-react";
import { useRef, useState, type FormEvent, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { chipClassName } from "@/shared/ui/chip";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { getInitials } from "./initials";
import { PreferenceSection } from "./PreferenceSection";
import {
  MAX_AUTHOR_LENGTH,
  MAX_AUTHORS,
  normalizeAuthor,
} from "./sanitizePreferences";
import { useAuthorSuggestions } from "./useAuthorSuggestions";

const MAX_SUGGESTIONS = 10;

interface AuthorPreferencesProps {
  authors: string[];
  onChange: (authors: string[]) => void;
}

export function AuthorPreferences({
  authors,
  onChange,
}: AuthorPreferencesProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const allSuggestions = useAuthorSuggestions();

  const followed = new Set(authors.map((name) => name.toLowerCase()));
  const suggestions = allSuggestions
    .filter((name) => !followed.has(name.toLowerCase()))
    .slice(0, MAX_SUGGESTIONS);
  const isFull = authors.length >= MAX_AUTHORS;

  // Empty or already-followed names (any case) are ignored.
  const addAuthor = (name: string) => {
    const normalized = normalizeAuthor(name);
    if (!normalized || isFull || followed.has(normalized.toLowerCase())) {
      return;
    }
    onChange([...authors, normalized]);
  };

  // The remove button disappears with its chip, so focus moves to the input. flushSync
  // re-renders first: if the list was full, the input is only enabled after this change.
  const removeAuthor = (name: string) => {
    flushSync(() => onChange(authors.filter((a) => a !== name)));
    inputRef.current?.focus();
  };

  // A form, so Enter adds the name.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addAuthor(draft);
    setDraft("");
  };

  // Clicking the field's empty space focuses the input, like one big text box.
  const handleFieldMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    inputRef.current?.focus();
  };

  return (
    <PreferenceSection
      title="Preferred authors"
      hint="Their articles move to the top of your feed. Pick from recent bylines or type any name."
    >
      <div className="flex flex-col gap-1.5">
        {/* One field: followed authors as chips, then the input. The ring follows focus inside. */}
        <div
          onMouseDown={handleFieldMouseDown}
          className="flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background p-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30"
        >
          {authors.length > 0 && (
            <ul
              aria-label="Followed authors"
              className="flex max-w-full min-w-0 flex-wrap gap-1.5"
            >
              {authors.map((name) => (
                <li
                  key={name}
                  className="flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-full bg-primary p-1 text-sm text-primary-foreground"
                >
                  {/* Initials drawn by CSS, so the item's text stays just the name. */}
                  <span
                    aria-hidden="true"
                    data-initials={getInitials(name)}
                    className="grid size-5 shrink-0 place-items-center rounded-full bg-primary-foreground/15 text-[10px] font-semibold before:content-[attr(data-initials)]"
                  />
                  <span title={name} className="truncate">
                    {name}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() => removeAuthor(name)}
                    className="grid size-5 shrink-0 cursor-pointer place-items-center rounded-full transition-colors outline-none hover:bg-primary-foreground/20 focus-visible:ring-2 focus-visible:ring-primary-foreground"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex min-w-40 flex-1 items-center gap-1"
          >
            <Label htmlFor="author-input" className="sr-only">
              Author name
            </Label>
            <Input
              ref={inputRef}
              id="author-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={isFull ? "Limit reached" : "Add an author…"}
              disabled={isFull}
              maxLength={MAX_AUTHOR_LENGTH}
              className="h-7 border-0 bg-transparent px-1.5 shadow-none focus-visible:ring-0 disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Add author"
              // Not disabled for an empty draft: a disabled submit button also blocks
              // Enter, and addAuthor already ignores empty names.
              disabled={isFull}
              className="size-7 shrink-0 rounded-full"
            >
              <Plus aria-hidden="true" />
            </Button>
          </form>
        </div>

        <div className="flex justify-between gap-4 text-xs text-muted-foreground">
          <span>
            {isFull
              ? "Limit reached: remove one to add another"
              : "Press Enter to add"}
          </span>
          <span className="tabular-nums">
            {authors.length} / {MAX_AUTHORS}
          </span>
        </div>
      </div>

      {suggestions.length > 0 && !isFull && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">From recent bylines</p>
          <ul aria-label="Suggested authors" className="flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  aria-label={`Follow ${name}`}
                  onClick={() => addAuthor(name)}
                  className={cn(
                    chipClassName,
                    "cursor-pointer border-dashed [--chip-color:var(--color-primary)] hover:border-solid",
                  )}
                >
                  <Plus aria-hidden="true" className="size-3.5" />
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PreferenceSection>
  );
}

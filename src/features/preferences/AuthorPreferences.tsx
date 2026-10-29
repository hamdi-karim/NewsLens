import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
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

  // A form, so Enter adds the name.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addAuthor(draft);
    setDraft("");
  };

  return (
    <PreferenceSection
      title="Preferred authors"
      hint="Their articles move to the top of your feed. Pick from recent bylines or type any name."
    >
      {authors.length > 0 && (
        <ul aria-label="Followed authors" className="flex flex-wrap gap-2">
          {authors.map((name) => (
            <li
              key={name}
              className="flex items-center gap-1 rounded-full border bg-muted/50 py-1 pr-1 pl-3 text-sm"
            >
              {name}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 rounded-full"
                aria-label={`Remove ${name}`}
                onClick={() => onChange(authors.filter((a) => a !== name))}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Label htmlFor="author-input" className="sr-only">
          Author name
        </Label>
        <div className="flex gap-2">
          <Input
            id="author-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              isFull ? `Up to ${MAX_AUTHORS} authors` : "Add an author…"
            }
            disabled={isFull}
            maxLength={MAX_AUTHOR_LENGTH}
          />
          <Button type="submit" variant="outline" disabled={isFull}>
            <Plus aria-hidden="true" />
            Add
          </Button>
        </div>
      </form>

      {suggestions.length > 0 && !isFull && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">From recent bylines</p>
          <ul aria-label="Suggested authors" className="flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <li key={name}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  aria-label={`Follow ${name}`}
                  onClick={() => addAuthor(name)}
                >
                  <Plus aria-hidden="true" />
                  {name}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PreferenceSection>
  );
}

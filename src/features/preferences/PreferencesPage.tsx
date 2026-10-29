import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { EMPTY_PREFERENCES, type Preferences } from "@/domain/types";
import { Button } from "@/shared/ui/button";
import { AuthorPreferences } from "./AuthorPreferences";
import { CategoryPreferences } from "./CategoryPreferences";
import { SourcePreferences } from "./SourcePreferences";
import { usePreferences } from "./usePreferences";

// Lists keep a canonical order (sources, categories) or insertion order (authors),
// so comparing JSON is enough.
function isSame(a: Preferences, b: Preferences): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Edits a draft; nothing is stored (and the feed doesn't refetch) until Save.
export function PreferencesPage() {
  const { preferences, setPreferences } = usePreferences();
  const [draft, setDraft] = useState(preferences);
  const navigate = useNavigate();

  const update = (changes: Partial<Preferences>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const handleSave = () => {
    try {
      setPreferences(draft);
    } catch {
      toast.error("Couldn't save your preferences", {
        description: "Your browser blocked storage. Please try again.",
      });
      return;
    }
    toast.success("Preferences saved");
    void navigate("/");
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground">
          Choose what shows up on your For You feed.
        </p>
      </header>

      <SourcePreferences
        selected={draft.sources}
        onChange={(sources) => update({ sources })}
      />
      <CategoryPreferences
        selected={draft.categories}
        onChange={(categories) => update({ categories })}
      />
      <AuthorPreferences
        authors={draft.authors}
        onChange={(authors) => update({ authors })}
      />

      <div className="flex items-center justify-between gap-4 border-t pt-6">
        <Button
          type="button"
          variant="ghost"
          disabled={isSame(draft, EMPTY_PREFERENCES)}
          onClick={() => setDraft(EMPTY_PREFERENCES)}
        >
          Reset
        </Button>
        <Button
          type="button"
          disabled={isSame(draft, preferences)}
          onClick={handleSave}
        >
          Save preferences
        </Button>
      </div>
    </div>
  );
}

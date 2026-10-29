import { useState } from "react";
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

interface PreferencesFormProps {
  // Called after a successful save: the page returns to the feed, the sheet closes.
  onSaved: () => void;
}

// Edits a draft; nothing is stored (and the feed doesn't refetch) until Save.
// Shared by the /preferences page and the header sheet.
export function PreferencesForm({ onSaved }: PreferencesFormProps) {
  const { preferences, setPreferences } = usePreferences();
  const [draft, setDraft] = useState(preferences);

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
    onSaved();
  };

  return (
    <div className="flex flex-col gap-8">
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

      {/* Sticky, so Save stays in reach below a long author list (page and sheet). */}
      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t bg-background py-4">
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

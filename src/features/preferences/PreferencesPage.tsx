import { useNavigate } from "react-router";
import { PreferencesForm } from "./PreferencesForm";

export function PreferencesPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground">
          Choose what shows up on your For You feed.
        </p>
      </header>
      <PreferencesForm onSaved={() => void navigate("/")} />
    </div>
  );
}

import { Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { PreferencesForm } from "./PreferencesForm";

// Header entry point to the same form as /preferences. Radix mounts the content only
// while open, so every open starts a fresh draft from the stored preferences.
export function PreferencesSheet() {
  // Controlled, so a successful save can close the sheet.
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 px-3 text-muted-foreground hover:text-foreground"
        >
          <Settings aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Preferences</span>
        </Button>
      </SheetTrigger>
      {/* bg-background matches the form's sticky action bar. */}
      <SheetContent className="gap-0 bg-background data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Preferences</SheetTitle>
          <SheetDescription>
            Choose what shows up on your For You feed.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
          <PreferencesForm onSaved={() => setIsOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

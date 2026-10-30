import { Search, Sparkles } from "lucide-react";
import type { MouseEvent } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { PreferencesSheet } from "@/features/preferences";
import { SearchBar } from "@/features/search";
import { ThemeToggle } from "@/features/theme";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/logo";

const MAIN_ID = "main";

const NAV_ITEMS = [
  { to: "/", label: "For You", icon: Sparkles },
  { to: "/search", label: "Search", icon: Search },
] as const;

// Focus main directly: following the #main hash would add it to the URL.
function skipToMain(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  document.getElementById(MAIN_ID)?.focus();
}

export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href={`#${MAIN_ID}`}
        onClick={skipToMain}
        className="sr-only rounded-md bg-background text-sm font-medium ring-3 ring-ring/50 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <NavLink
            to="/"
            className="mr-auto inline-flex items-center gap-2 text-lg font-semibold tracking-tight md:mr-0"
          >
            <Logo />
            NewsLens
          </NavLink>
          {/* Own row on mobile; between logo and nav from md. */}
          <div className="order-last w-full md:order-none md:w-auto md:max-w-md md:flex-1">
            <SearchBar />
          </div>
          <nav aria-label="Main" className="md:ml-auto">
            <ul className="flex gap-1 text-sm">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end
                    className={({ isActive }) =>
                      cn(
                        "inline-flex h-10 items-center gap-2 rounded-md px-3 text-muted-foreground transition-colors hover:text-foreground",
                        isActive && "bg-muted text-foreground",
                      )
                    }
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {/* Icons only on small phones; the text still names the link. */}
                    <span className="sr-only sm:not-sr-only">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {/* On /preferences the page is the form; a second one would hold a stale draft. */}
          {pathname !== "/preferences" && <PreferencesSheet />}
          <ThemeToggle />
        </div>
      </header>
      <main
        id={MAIN_ID}
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 py-6 outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
}

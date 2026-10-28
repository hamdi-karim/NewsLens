import { NavLink, Outlet } from "react-router";
import { cn } from "@/shared/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "For You" },
  { to: "/search", label: "Search" },
  { to: "/preferences", label: "Preferences" },
] as const;

export function AppLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="text-lg font-semibold tracking-tight">
            NewsLens
          </NavLink>
          <nav aria-label="Main">
            <ul className="flex gap-1 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      cn(
                        "rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground",
                        isActive && "bg-muted text-foreground",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

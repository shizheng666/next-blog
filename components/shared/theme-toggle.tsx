"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { getThemeToggleViewState } from "@/components/shared/theme-toggle-state";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const state = getThemeToggleViewState({
    mounted,
    resolvedTheme
  });

  return (
    <button
      aria-label={state.ariaLabel}
      className="rounded-md border px-3 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      onClick={() => {
        if (state.nextTheme) {
          setTheme(state.nextTheme);
        }
      }}
      type="button"
    >
      <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center">
        {state.icon === "sun" ? <Sun className="h-4 w-4" /> : null}
        {state.icon === "moon" ? <Moon className="h-4 w-4" /> : null}
      </span>
    </button>
  );
}

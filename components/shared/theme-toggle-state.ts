export type ThemeToggleIcon = "sun" | "moon" | null;
export type NextThemeValue = "light" | "dark" | null;

interface ThemeToggleViewStateInput {
  mounted: boolean;
  resolvedTheme?: string | null;
}

interface ThemeToggleViewState {
  ariaLabel: string;
  icon: ThemeToggleIcon;
  nextTheme: NextThemeValue;
}

export function getThemeToggleViewState({
  mounted,
  resolvedTheme
}: ThemeToggleViewStateInput): ThemeToggleViewState {
  if (!mounted || (resolvedTheme !== "light" && resolvedTheme !== "dark")) {
    return {
      ariaLabel: "切换主题",
      icon: null,
      nextTheme: null
    };
  }

  if (resolvedTheme === "dark") {
    return {
      ariaLabel: "切换到浅色主题",
      icon: "sun",
      nextTheme: "light"
    };
  }

  return {
    ariaLabel: "切换到深色主题",
    icon: "moon",
    nextTheme: "dark"
  };
}

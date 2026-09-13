"use client";

import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => {
        const isDark =
          document.documentElement.classList.contains("dark");

        setTheme(isDark ? "light" : "dark");
      }}
      className="
        rounded-lg
        border border-ikbs-border
        bg-ikbs-card
        px-3
        py-2
        text-foreground
        transition
        hover:border-ikbs-primary
      "
      aria-label="Changer de thème"
    >
      <span className="hidden dark:inline">☀️</span>
      <span className="inline dark:hidden">🌙</span>
    </button>
  );
}
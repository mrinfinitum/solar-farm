"use client";

import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const storageKey = "nsoul-theme";

export function ThemeToggle() {
  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem(storageKey, nextTheme);
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label="Toggle color theme"
      title="Toggle light and dark mode"
      onClick={toggleTheme}
    >
      <Sun className="theme-toggle__sun" aria-hidden="true" size={16} />
      <Moon className="theme-toggle__moon" aria-hidden="true" size={16} />
      <span className="sr-only">Toggle light and dark mode</span>
    </button>
  );
}

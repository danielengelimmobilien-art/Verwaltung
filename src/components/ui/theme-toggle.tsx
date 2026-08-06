"use client";

import { useEffect, useState } from "react";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M20 14.5a8.5 8.5 0 1 1-9.5-11.9 7 7 0 0 0 9.5 11.9Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const aktuell = document.documentElement.getAttribute("data-theme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(aktuell ? aktuell === "dark" : systemDark);
      setMounted(true);
    });
  }, []);

  function toggle() {
    const naechster = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", naechster);
    window.localStorage.setItem("theme", naechster);
    setIsDark(naechster === "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Zu hellem Design wechseln" : "Zu dunklem Design wechseln"}
      title={isDark ? "Helles Design" : "Dunkles Design"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition-colors"
    >
      {!mounted ? <span className="h-4 w-4" /> : isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

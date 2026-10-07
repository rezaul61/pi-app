"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";

export function AuthThemeToggle() {
  const [dark, setDark] = useState(true);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.cookie = `pi-theme=${next};path=/;max-age=31536000`;
    setDark(!dark);
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Pearl mode" : "Midnight mode"}
      className="press fixed top-4 right-4 z-50 flex size-10 cursor-pointer items-center justify-center rounded-xl glass-2 text-ink-2 hover:text-ink"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

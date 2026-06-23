"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-md bg-muted/20" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md bg-muted/30 hover:bg-muted/80 text-foreground transition-colors border border-border/40"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? <Sun size={18} className="text-cyan-400" /> : <Moon size={18} className="text-blue-600" />}
    </button>
  );
}

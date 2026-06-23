"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Cpu, Menu, X, Heart, Settings } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
          <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
          <span>
            Electro<span className="text-cyan-400">Base</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-cyan-400",
                  isActive ? "text-cyan-400 font-semibold" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/favorites" className="relative p-2 text-muted-foreground hover:text-rose-500 transition-colors">
            <Heart size={20} />
          </Link>
          <Link href="/admin" className="p-2 text-muted-foreground hover:text-cyan-400 transition-colors" title="Admin Panel">
            <Settings size={20} />
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md hover:bg-muted/40 text-foreground"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block py-2 text-base font-medium rounded-md px-3 hover:bg-muted/50 hover:text-cyan-400 transition-colors",
                  isActive ? "text-cyan-400 bg-muted/30" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="h-px bg-border/40 my-2" />
          <div className="flex items-center justify-between px-3">
            <Link
              href="/favorites"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-muted-foreground hover:text-rose-500"
            >
              <Heart size={18} />
              <span>Favorites</span>
            </Link>
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-muted-foreground hover:text-cyan-400"
            >
              <Settings size={18} />
              <span>Admin Panel</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

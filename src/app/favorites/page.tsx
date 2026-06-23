"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { ComponentCard } from "@/components/component-card";
import { GridSkeleton } from "@/components/loading-skeleton";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

interface Component {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  description: string;
  packageType: string | null;
  footprint: string | null;
  tags: string;
  pinCount: number | null;
}

export default function FavoritesPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("electrobase_favorites");
      if (!stored) {
        setComponents([]);
        return;
      }

      const ids: string[] = JSON.parse(stored);
      if (ids.length === 0) {
        setComponents([]);
        return;
      }

      // Fetch components
      const res = await fetch("/api/components?limit=100");
      const data = await res.json();
      const all: Component[] = data.components || [];

      // Filter by favorites list
      const favs = all.filter((comp) => ids.includes(comp.id));
      setComponents(favs);
    } catch (error) {
      console.error("Failed to load favorites", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();

    // Listen to storage update event to keep in sync
    const handleStorage = () => loadFavorites();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Favorites" }]} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Favorites</h1>
        <p className="text-muted-foreground text-sm">
          Your bookmarked components stored locally in your browser workspace.
        </p>
      </div>

      {loading ? (
        <GridSkeleton count={4} />
      ) : components.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {components.map((comp) => (
            <ComponentCard key={comp.id} {...comp} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl glass border border-border/40 p-16 text-center space-y-4 max-w-md mx-auto">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <Heart size={20} />
          </div>
          <h2 className="text-lg font-semibold">No favorites saved</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Bookmarks help you quickly reference datasheets and specifications of parts you use frequently.
          </p>
          <div className="pt-2">
            <Link
              href="/components"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              <span>Browse components</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

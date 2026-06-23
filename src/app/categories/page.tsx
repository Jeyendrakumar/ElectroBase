"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  count: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories", error);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Categories" }]} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Categories</h1>
        <p className="text-muted-foreground text-sm">
          Browse electronic components grouped by their functional category classifications.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl glass border border-border/40 p-5 space-y-4">
              <div className="h-6 w-1/3 bg-muted/40 rounded" />
              <div className="h-4 w-5/6 bg-muted/20 rounded" />
              <div className="h-4 w-12 bg-muted/30 rounded" />
            </div>
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.name] || Folder;
            const badgeColors = CATEGORY_COLORS[cat.name] || "text-cyan-400 border-cyan-500/20";
            return (
              <Link
                key={cat.id}
                href={`/components?category=${encodeURIComponent(cat.name)}`}
                className="group p-6 rounded-xl border border-border/40 glass glass-hover duration-300 flex flex-col justify-between h-40"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg bg-muted/20 border", badgeColors)}>
                      <Icon size={18} />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground group-hover:text-cyan-400 transition-colors">
                      {cat.name}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                    {cat.description || "Browse components in this category."}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/10 text-xs font-mono">
                  <span className="text-muted-foreground">{cat.count} components</span>
                  <span className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>View Parts</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground font-mono text-sm">
          No categories registered.
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getSchematicSvg } from "@/lib/schematic-svgs";

interface ComponentCardProps {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  description: string;
  packageType: string | null;
  footprint: string | null;
  tags: string;
  pinCount: number | null;
  imageUrl?: string | null;
}

export function ComponentCard({
  id,
  name,
  category,
  manufacturer,
  description,
  packageType,
  footprint,
  tags,
  pinCount,
  imageUrl,
}: ComponentCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [favorite, setFavorite] = useState(isFavorite(id));

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
    const newVal = !favorite;
    setFavorite(newVal);
    if (newVal) {
      toast.success(`${name} added to favorites`);
    } else {
      toast.info(`${name} removed from favorites`);
    }
  };

  const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS["IC"];
  const badgeColors = CATEGORY_COLORS[category] || CATEGORY_COLORS["IC"];
  const parsedTags = tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 3);

  // SVG representation for component fallback images
  const getSvgPlaceholder = () => {
    return (
      <svg className="w-full h-full text-cyan-500/25" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="80" height="80" rx="10" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="2" />
        <line x1="50" y1="10" x2="50" y2="30" stroke="currentColor" strokeWidth="2" />
        <line x1="50" y1="70" x2="50" y2="90" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="50" x2="30" y2="50" stroke="currentColor" strokeWidth="2" />
        <line x1="70" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  };

  return (
    <Link
      href={`/components/${id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden glass glass-hover duration-300"
    >
      {/* Favorite Button Overlay */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-background/60 hover:bg-background/90 border border-border/40 text-foreground transition-all hover:scale-105"
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart size={16} className={cn("transition-colors", favorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
      </button>

      {/* Component Schematic Preview Image Area */}
      <div className="relative h-40 w-full bg-slate-950/40 dark:bg-slate-950/80 border-b border-border/20 flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-background/50 pointer-events-none" />
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-contain mix-blend-lighten opacity-85 group-hover:scale-105 transition-transform duration-300" />
        ) : (
          getSchematicSvg(category, name)
        )}
        <span className="absolute bottom-2 left-2 text-[10px] uppercase font-mono tracking-widest text-muted-foreground/60">
          {packageType || footprint || "Standard Package"}
        </span>
      </div>

      {/* Card Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-mono text-cyan-400/80">{manufacturer}</span>
            <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", badgeColors)}>
              <span className="flex items-center gap-1">
                <Icon size={10} />
                {category}
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-cyan-400 transition-colors">
            {name}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Footer info & tags */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {parsedTags.map(tag => (
              <span key={tag} className="text-[10px] font-mono bg-muted/40 px-2 py-0.5 rounded text-muted-foreground/80 border border-border/20">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/20 text-xs font-mono text-muted-foreground">
            {pinCount !== null && (
              <span>Pins: {pinCount}</span>
            )}
            {footprint && (
              <span>FP: {footprint}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

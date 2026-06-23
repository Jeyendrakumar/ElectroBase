"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FavoriteButtonProps {
  id: string;
  name: string;
  className?: string;
}

export function FavoriteButton({ id, name, className }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [favorite, setFavorite] = useState(isFavorite(id));

  const handleToggle = () => {
    toggleFavorite(id);
    const newVal = !favorite;
    setFavorite(newVal);
    if (newVal) {
      toast.success(`${name} added to favorites`);
    } else {
      toast.info(`${name} removed from favorites`);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-mono transition-all duration-300",
        favorite
          ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
          : "bg-muted/20 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40",
        className
      )}
    >
      <Heart size={16} className={cn("transition-transform duration-300", favorite ? "fill-rose-400 text-rose-400 scale-110" : "text-muted-foreground")} />
      <span>{favorite ? "Favorited" : "Add to Favorites"}</span>
    </button>
  );
}

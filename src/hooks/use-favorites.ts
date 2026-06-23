"use client";

import { useEffect, useState } from "react";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("electrobase_favorites");
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  const addFavorite = (id: string) => {
    const updated = [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("electrobase_favorites", JSON.stringify(updated));
  };

  const removeFavorite = (id: string) => {
    const updated = favorites.filter((favId) => favId !== id);
    setFavorites(updated);
    localStorage.setItem("electrobase_favorites", JSON.stringify(updated));
  };

  const isFavorite = (id: string) => {
    return favorites.includes(id);
  };

  const toggleFavorite = (id: string) => {
    if (isFavorite(id)) {
      removeFavorite(id);
    } else {
      addFavorite(id);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}

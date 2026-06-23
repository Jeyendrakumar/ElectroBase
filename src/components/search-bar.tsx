"use client";

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string, filters: { category: string; footprint: string }) => void;
  categories: string[];
  footprints: string[];
}

export function SearchBar({ onSearch, categories, footprints }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [footprint, setFootprint] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (val: string) => {
    setQuery(val);
    onSearch(val, { category, footprint });
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    onSearch(query, { category: val, footprint });
  };

  const handleFootprintChange = (val: string) => {
    setFootprint(val);
    onSearch(query, { category, footprint: val });
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setFootprint("");
    onSearch("", { category: "", footprint: "" });
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, tags, manufacturer or specs..."
            className="w-full pl-10 pr-10 py-3 rounded-lg border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans text-sm text-foreground transition-all"
          />
          {query && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "px-4 py-3 rounded-lg border border-border/40 flex items-center gap-2 text-sm transition-all bg-card/25",
            showFilters ? "border-cyan-500/50 text-cyan-400" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter size={16} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {showFilters && (
        <div className="p-4 rounded-xl border border-border/40 glass grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            >
              <option value="" className="bg-slate-900 text-foreground">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-foreground">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1.5 block">Footprint</label>
            <select
              value={footprint}
              onChange={(e) => handleFootprintChange(e.target.value)}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            >
              <option value="" className="bg-slate-900 text-foreground">All Footprints</option>
              {footprints.map((fp) => (
                <option key={fp} value={fp} className="bg-slate-900 text-foreground">
                  {fp}
                </option>
              ))}
            </select>
          </div>

          {(category || footprint || query) && (
            <div className="sm:col-span-2 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
              >
                Clear Search & Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

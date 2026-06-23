"use client";

import { useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { ComponentCard } from "@/components/component-card";
import { GridSkeleton } from "@/components/loading-skeleton";
import { PaginationControls } from "@/components/pagination-controls";
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
  imageUrl?: string | null;
}

export default function ComponentsPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [footprints, setFootprints] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFootprint, setSelectedFootprint] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComponents = async (
    q: string = query,
    cat: string = selectedCategory,
    fp: string = selectedFootprint,
    mfg: string = selectedManufacturer,
    pageNum: number = page
  ) => {
    setLoading(true);
    try {
      const url = `/api/components?q=${encodeURIComponent(q)}&category=${encodeURIComponent(
        cat
      )}&footprint=${encodeURIComponent(fp)}&manufacturer=${encodeURIComponent(mfg)}&page=${pageNum}`;
      const res = await fetch(url);
      const data = await res.json();

      setComponents(data.components || []);
      setTotalPages(data.totalPages || 1);
      if (data.categories) setCategories(data.categories);
      if (data.footprints) setFootprints(data.footprints);
      if (data.manufacturers) setManufacturers(data.manufacturers);
    } catch (error) {
      console.error("Failed to load components", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("category") || "";
      const fpParam = params.get("footprint") || "";
      const mfgParam = params.get("manufacturer") || "";
      const qParam = params.get("q") || "";

      setQuery(qParam);
      setSelectedCategory(catParam);
      setSelectedFootprint(fpParam);
      setSelectedManufacturer(mfgParam);

      fetchComponents(qParam, catParam, fpParam, mfgParam, 1);
    } else {
      fetchComponents();
    }
  }, []);

  const handleSearch = (
    val: string,
    filters: { category: string; footprint: string; manufacturer: string }
  ) => {
    setQuery(val);
    setSelectedCategory(filters.category);
    setSelectedFootprint(filters.footprint);
    setSelectedManufacturer(filters.manufacturer);
    setPage(1);
    
    // Update the URL query params dynamically to reflect the current search filters!
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (val) params.set("q", val);
      if (filters.category) params.set("category", filters.category);
      if (filters.footprint) params.set("footprint", filters.footprint);
      if (filters.manufacturer) params.set("manufacturer", filters.manufacturer);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }

    fetchComponents(val, filters.category, filters.footprint, filters.manufacturer, 1);
  };

  const handlePageChange = (pageNum: number) => {
    setPage(pageNum);
    fetchComponents(query, selectedCategory, selectedFootprint, selectedManufacturer, pageNum);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Components" }]} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Components Library</h1>
        <p className="text-muted-foreground text-sm">
          Browse, filter, and search through the entire catalog of electronic parts.
        </p>
      </div>

      <SearchBar
        onSearch={handleSearch}
        categories={categories}
        footprints={footprints}
        manufacturers={manufacturers}
        initialQuery={query}
        initialCategory={selectedCategory}
        initialFootprint={selectedFootprint}
        initialManufacturer={selectedManufacturer}
      />

      {loading ? (
        <GridSkeleton count={8} />
      ) : components.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {components.map((comp) => (
              <ComponentCard key={comp.id} {...comp} />
            ))}
          </div>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="rounded-xl glass border border-border/40 p-12 text-center text-muted-foreground font-mono text-sm">
          No matching components found. Try refining your query or filters.
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

function ComponentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get search params
  const qParam = searchParams.get("q") || "";
  const catParam = searchParams.get("category") || "";
  const fpParam = searchParams.get("footprint") || "";
  const mfgParam = searchParams.get("manufacturer") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const [components, setComponents] = useState<Component[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [footprints, setFootprints] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Sync state variables from URL parameters
  const [query, setQuery] = useState(qParam);
  const [selectedCategory, setSelectedCategory] = useState(catParam);
  const [selectedFootprint, setSelectedFootprint] = useState(fpParam);
  const [selectedManufacturer, setSelectedManufacturer] = useState(mfgParam);
  const [page, setPage] = useState(pageParam);

  const fetchComponents = async (
    q: string,
    cat: string,
    fp: string,
    mfg: string,
    pageNum: number
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

  // Reactively fetch components and update local states when search parameters change (supports browser navigation/transitions)
  useEffect(() => {
    setQuery(qParam);
    setSelectedCategory(catParam);
    setSelectedFootprint(fpParam);
    setSelectedManufacturer(mfgParam);
    setPage(pageParam);

    fetchComponents(qParam, catParam, fpParam, mfgParam, pageParam);
  }, [qParam, catParam, fpParam, mfgParam, pageParam]);

  const handleSearch = (
    val: string,
    filters: { category: string; footprint: string; manufacturer: string }
  ) => {
    const params = new URLSearchParams();
    if (val) params.set("q", val);
    if (filters.category) params.set("category", filters.category);
    if (filters.footprint) params.set("footprint", filters.footprint);
    if (filters.manufacturer) params.set("manufacturer", filters.manufacturer);
    params.set("page", "1");
    router.push(`/components?${params.toString()}`);
  };

  const handlePageChange = (pageNum: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pageNum));
    router.push(`/components?${params.toString()}`);
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

export default function ComponentsPage() {
  return (
    <Suspense fallback={<GridSkeleton count={8} />}>
      <ComponentsPageContent />
    </Suspense>
  );
}

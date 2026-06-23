"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, ArrowLeft, BookOpen, Layers, Cpu } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DetailSkeleton } from "@/components/loading-skeleton";
import { CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Pin {
  id: string;
  pinNumber: number;
  pinName: string;
  description: string;
}

interface Spec {
  id: string;
  parameter: string;
  value: string;
  unit: string | null;
}

interface ComponentDetail {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  description: string;
  datasheetUrl: string | null;
  imageUrl: string | null;
  footprint: string | null;
  packageType: string | null;
  pinCount: number | null;
  tags: string;
  pins: Pin[];
  specifications: Spec[];
}

export default function ComponentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [component, setComponent] = useState<ComponentDetail | null>(null);
  const [related, setRelated] = useState<ComponentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/components/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setComponent(data);

        // Fetch related components based on category
        const relRes = await fetch(`/api/components?category=${encodeURIComponent(data.category)}&limit=7`);
        const relData = await relRes.json();
        const filtered = (relData.components || []).filter((c: any) => c.id !== data.id).slice(0, 6);
        setRelated(filtered);
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!component) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-2xl font-bold">Component Not Found</h1>
        <p className="text-muted-foreground">The component requested does not exist or has been deleted.</p>
        <Link href="/components" className="inline-flex items-center gap-2 text-cyan-400 font-mono text-sm hover:underline">
          <ArrowLeft size={16} /> Back to Library
        </Link>
      </div>
    );
  }

  const badgeColors = CATEGORY_COLORS[component.category] || CATEGORY_COLORS["IC"];
  const parsedTags = component.tags ? component.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: "Components", href: "/components" }, { label: component.name }]} />

      {/* Main Intro Header Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 h-64 lg:h-auto min-h-[250px] bg-slate-950/40 dark:bg-slate-950/80 rounded-2xl glass border border-border/40 flex items-center justify-center p-8 relative overflow-hidden group">
          <svg className="w-32 h-32 text-cyan-500/25 group-hover:scale-105 transition-transform duration-500" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="80" rx="10" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="2" />
            <line x1="50" y1="10" x2="50" y2="30" stroke="currentColor" strokeWidth="2" />
            <line x1="50" y1="70" x2="50" y2="90" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="50" x2="30" y2="50" stroke="currentColor" strokeWidth="2" />
            <line x1="70" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="lg:col-span-2 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-mono text-cyan-400 font-semibold uppercase tracking-wider">{component.manufacturer}</span>
              <div className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border", badgeColors)}>
                {component.category}
              </div>
              {component.packageType && (
                <span className="text-xs font-mono bg-muted/30 px-2 py-0.5 rounded border border-border/40 text-muted-foreground">
                  {component.packageType}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{component.name}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">{component.description}</p>

            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {parsedTags.map(tag => (
                  <Link
                    key={tag}
                    href={`/components?q=${encodeURIComponent(tag)}`}
                    className="text-xs px-2.5 py-1 rounded-md border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 font-mono transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {component.datasheetUrl && (
              <a
                href={component.datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-mono text-xs transition-colors"
              >
                <Download size={14} />
                <span>Datasheet PDF</span>
                <ExternalLink size={12} className="opacity-80" />
              </a>
            )}
            <FavoriteButton id={component.id} name={component.name} />
          </div>
        </div>
      </section>

      {/* Specifications and Pinout Layout with a Sidebar */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Main Details (Specs & Pins) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Specifications Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold border-b border-border/40 pb-2">
              <Layers size={18} className="text-cyan-400" />
              <h2>Technical Specifications</h2>
            </div>
            <div className="rounded-lg border border-border/40 overflow-hidden glass">
              <table className="w-full text-sm font-sans">
                <tbody>
                  {component.specifications.length > 0 ? (
                    component.specifications.map((spec) => (
                      <tr key={spec.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                        <td className="p-3 font-medium text-muted-foreground font-mono text-xs w-1/2">{spec.parameter}</td>
                        <td className="p-3 font-mono text-foreground text-xs w-1/2">
                          {spec.value} {spec.unit}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-4 text-center text-muted-foreground text-xs font-mono" colSpan={2}>
                        No electrical specifications registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pinout Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold border-b border-border/40 pb-2">
              <Cpu size={18} className="text-cyan-400" />
              <h2>Pin Configuration ({component.pinCount || component.pins.length} Pinout)</h2>
            </div>
            <div className="rounded-lg border border-border/40 overflow-hidden glass max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm font-sans">
                <thead className="bg-muted/20 border-b border-border/40 sticky top-0 backdrop-blur-md">
                  <tr className="font-mono text-xs text-muted-foreground">
                    <th className="p-2.5 text-center w-16">Pin</th>
                    <th className="p-2.5 text-left w-24">Name</th>
                    <th className="p-2.5 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {component.pins.length > 0 ? (
                    component.pins.map((pin) => (
                      <tr key={pin.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                        <td className="p-2.5 text-center font-bold font-mono text-xs text-cyan-400">{pin.pinNumber}</td>
                        <td className="p-2.5 font-bold font-mono text-xs text-foreground">{pin.pinName}</td>
                        <td className="p-2.5 text-muted-foreground text-xs">{pin.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-4 text-center text-muted-foreground text-xs font-mono" colSpan={3}>
                        No pin configuration details registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-border/40 glass space-y-4">
            <h3 className="text-sm font-bold font-mono text-cyan-400 tracking-wider uppercase">Reference Quick-Info</h3>
            <div className="space-y-3.5 divide-y divide-border/25">
              <div className="flex justify-between text-xs pt-1">
                <span className="text-muted-foreground font-mono">Manufacturer</span>
                <span className="font-semibold text-foreground text-right">{component.manufacturer}</span>
              </div>
              <div className="flex justify-between text-xs pt-3">
                <span className="text-muted-foreground font-mono">Category</span>
                <span className="font-semibold text-foreground text-right">{component.category}</span>
              </div>
              <div className="flex justify-between text-xs pt-3">
                <span className="text-muted-foreground font-mono">Footprint</span>
                <span className="font-semibold text-foreground text-right">{component.footprint || "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs pt-3">
                <span className="text-muted-foreground font-mono">Package Type</span>
                <span className="font-semibold text-foreground text-right">{component.packageType || "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs pt-3">
                <span className="text-muted-foreground font-mono">Pin Count</span>
                <span className="font-semibold text-foreground text-right font-mono">{component.pinCount || component.pins.length || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Components Section */}
      {related.length > 0 && (
        <section className="space-y-4 pt-8 border-t border-border/20">
          <h2 className="text-xl font-bold tracking-tight">Related Components</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {related.map((comp) => (
              <Link
                key={comp.id}
                href={`/components/${comp.id}`}
                className="p-4 rounded-xl border border-border/40 glass hover:border-cyan-500/30 transition-all text-sm block space-y-2"
              >
                <span className="text-[10px] font-mono text-cyan-400">{comp.manufacturer}</span>
                <h3 className="font-semibold text-foreground truncate group-hover:text-cyan-400">{comp.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{comp.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

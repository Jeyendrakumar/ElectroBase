"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Grid, ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

interface Footprint {
  id: string;
  name: string;
  description: string | null;
  dimensions: string | null;
  recommendedLayout: string | null;
}

export default function FootprintsPage() {
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFootprints() {
      try {
        const res = await fetch("/api/footprints");
        const data = await res.json();
        setFootprints(data);
      } catch (error) {
        console.error("Failed to load footprints", error);
      } finally {
        setLoading(false);
      }
    }
    loadFootprints();
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Footprints" }]} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Footprints Library</h1>
        <p className="text-muted-foreground text-sm">
          Browse package footprint specifications, physical dimensions, and recommended PCB layout metrics.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl glass border border-border/40 p-5 space-y-4">
              <div className="h-6 w-1/3 bg-muted/40 rounded" />
              <div className="h-4 w-5/6 bg-muted/20 rounded" />
              <div className="h-4 w-12 bg-muted/30 rounded" />
            </div>
          ))}
        </div>
      ) : footprints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {footprints.map((fp) => (
            <div
              key={fp.id}
              className="p-6 rounded-xl border border-border/40 glass hover:border-cyan-500/25 transition-all space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted/20 border border-border/40 text-cyan-400">
                  <Grid size={18} />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{fp.name} Package</h2>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{fp.description}</p>
                {fp.dimensions && (
                  <p className="text-xs font-mono text-cyan-400">
                    <span className="text-muted-foreground font-sans">Dimensions:</span> {fp.dimensions}
                  </p>
                )}
                {fp.recommendedLayout && (
                  <div className="p-3 bg-muted/10 border border-border/20 rounded-md mt-2">
                    <span className="text-xs font-semibold text-foreground font-mono block mb-1">Recommended PCB Layout:</span>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">{fp.recommendedLayout}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/10 flex justify-end">
                <Link
                  href={`/components?footprint=${encodeURIComponent(fp.name)}`}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
                >
                  <span>Filter components</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground font-mono text-sm">
          No package footprints registered.
        </div>
      )}
    </div>
  );
}

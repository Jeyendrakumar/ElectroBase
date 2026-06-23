"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Star, Layers, Activity } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { ComponentCard } from "@/components/component-card";
import { GridSkeleton } from "@/components/loading-skeleton";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Stats {
  totalComponents: number;
  totalICs: number;
  totalResistors: number;
  totalCapacitors: number;
}

interface RecentComponent {
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

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentComponent[]>([]);
  const [favCount, setFavCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read local storage favorites count
    const favs = localStorage.getItem("electrobase_favorites");
    if (favs) {
      try {
        setFavCount(JSON.parse(favs).length);
      } catch (e) {}
    }

    async function fetchData() {
      try {
        const statsRes = await fetch("/api/stats");
        const statsData = await statsRes.json();
        setStats(statsData);

        const recentRes = await fetch("/api/components?limit=4");
        const recentData = await recentRes.json();
        setRecent(recentData.components || []);
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-10 py-4">
      {/* Hero Welcome banner */}
      <section className="relative rounded-2xl glass border border-border/40 p-8 md:p-12 overflow-hidden flex flex-col justify-center items-start gap-6 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400">
            <Activity size={12} className="animate-pulse" />
            <span>ELECTRONICS DATABASE ONLINE</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">ElectroBase</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            The reference library for makers and engineers. Easily look up specifications, pin layouts, download datasheets, and organize favorites.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 mt-2">
          <Link
            href="/components"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all font-mono text-sm"
          >
            <span>Explore Components</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/footprints"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors font-mono text-sm"
          >
            <span>Footprints</span>
          </Link>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Components"
          value={loading ? "..." : stats?.totalComponents || 0}
          icon={Cpu}
          colorClass="text-cyan-400 border-cyan-500/20"
        />
        <StatCard
          label="Integrated Circuits (ICs)"
          value={loading ? "..." : stats?.totalICs || 0}
          icon={Cpu}
          colorClass="text-blue-400 border-blue-500/20"
        />
        <StatCard
          label="Total Resistors"
          value={loading ? "..." : stats?.totalResistors || 0}
          icon={Layers}
          colorClass="text-amber-400 border-amber-500/20"
        />
        <StatCard
          label="Total Capacitors"
          value={loading ? "..." : stats?.totalCapacitors || 0}
          icon={Layers}
          colorClass="text-emerald-400 border-emerald-500/20"
        />
        <StatCard
          label="Your Favorites"
          value={favCount}
          icon={Star}
          colorClass="text-rose-400 border-rose-500/20"
          description="Saved in browser storage"
        />
      </section>

      {/* Recent Components Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Recent Additions</h2>
            <p className="text-sm text-muted-foreground">The latest components updated in the inventory.</p>
          </div>
          <Link href="/components" className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <GridSkeleton count={4} />
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recent.map((comp) => (
              <ComponentCard key={comp.id} {...comp} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl glass border border-border/40 p-12 text-center text-muted-foreground">
            No components found. Run database migrations and seed script.
          </div>
        )}
      </section>
    </div>
  );
}

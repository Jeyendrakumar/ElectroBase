"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Star, Layers, Activity, FileText, FolderOpen } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { ComponentCard } from "@/components/component-card";
import { GridSkeleton } from "@/components/loading-skeleton";
import { CATEGORY_ICONS } from "@/lib/constants";

interface Stats {
  totalComponents: number;
  totalDatasheets: number;
  totalCategories: number;
  topCategories: { name: string; count: number }[];
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

        const recentRes = await fetch("/api/components?limit=6");
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

  // Determine stat card color based on category
  const getCategoryColor = (name: string): string => {
    const colorMap: Record<string, string> = {
      IC: "text-blue-400 border-blue-500/20",
      Sensor: "text-teal-400 border-teal-500/20",
      Microcontroller: "text-cyan-400 border-cyan-500/20",
      Resistor: "text-amber-400 border-amber-500/20",
      Transistor: "text-purple-400 border-purple-500/20",
      Diode: "text-red-400 border-red-500/20",
      Capacitor: "text-emerald-400 border-emerald-500/20",
      Connector: "text-orange-400 border-orange-500/20",
      "Motor Driver": "text-violet-400 border-violet-500/20",
      "Power Module": "text-yellow-400 border-yellow-500/20",
    };
    return colorMap[name] || "text-cyan-400 border-cyan-500/20";
  };

  return (
    <div className="space-y-10 py-4">
      {/* Hero Welcome banner */}
      <section className="relative rounded-2xl glass border border-border/40 p-8 md:p-12 overflow-hidden flex flex-col justify-center items-start gap-6 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400">
            <Activity size={12} className="animate-pulse" />
            <span>ELECTRONICS REFERENCE DATABASE ONLINE</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">ElectroBase</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            The all-in-one reference library for electronic and hardware engineers. Look up datasheets, pin configurations, specifications, and footprints for {stats?.totalComponents || "80"}+ components instantly.
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
            href="/categories"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors font-mono text-sm"
          >
            <span>Browse Categories</span>
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
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Components"
          value={loading ? "..." : stats?.totalComponents || 0}
          icon={Cpu}
          colorClass="text-cyan-400 border-cyan-500/20"
        />
        <StatCard
          label="Datasheets Available"
          value={loading ? "..." : stats?.totalDatasheets || 0}
          icon={FileText}
          colorClass="text-blue-400 border-blue-500/20"
          description="Direct PDF downloads"
        />
        <StatCard
          label="Component Categories"
          value={loading ? "..." : stats?.totalCategories || 0}
          icon={FolderOpen}
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

      {/* Top Categories Breakdown */}
      {!loading && stats?.topCategories && stats.topCategories.length > 0 && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.topCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.name] || Layers;
            return (
              <Link
                key={cat.name}
                href={`/components?category=${encodeURIComponent(cat.name)}`}
                className="p-4 rounded-xl glass border border-border/40 hover:border-cyan-500/30 transition-all group flex flex-col items-center text-center gap-2"
              >
                <div className={`p-2 rounded-lg bg-muted/20 border ${getCategoryColor(cat.name)}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs font-medium text-foreground group-hover:text-cyan-400 transition-colors">{cat.name}</span>
                <span className="text-lg font-bold font-mono text-foreground">{cat.count}</span>
              </Link>
            );
          })}
        </section>
      )}

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
          <GridSkeleton count={6} />
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




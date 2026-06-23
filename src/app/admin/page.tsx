"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdmin } from "./admin-provider";
import { Cpu, LayoutDashboard, FileEdit, FolderPlus, Grid, LogOut, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const { isAdmin, login, logout } = useAdmin();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(password);
    setLoading(false);
    if (ok) {
      toast.success("Welcome back, Administrator.");
    } else {
      toast.error("Incorrect administrator access key.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md p-8 rounded-2xl glass border border-border/40 space-y-6"
        >
          <div className="text-center space-y-2">
            <Cpu className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">Admin Authentication</h1>
            <p className="text-xs text-muted-foreground font-mono">ELECTROBASE CENTRAL CONTROL</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground block">ACCESS CONTROL PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••"
              className="w-full py-2.5 px-3 rounded-lg border border-border/40 bg-card/50 text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-mono text-xs transition-colors font-bold"
          >
            {loading ? "AUTHENTICATING..." : "VERIFY SECURITY KEY"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-xs font-mono text-cyan-400">STATUS: AUTHENTICATED // SYSTEM ONLINE</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-mono transition-colors"
        >
          <LogOut size={14} />
          <span>Exit Console</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/components"
          className="p-6 rounded-xl border border-border/40 glass glass-hover h-40 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <LayoutDashboard size={18} />
              <h2>Manage Components</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Add new components, update pin specifications, or delete components from the records.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Go to Panel &rarr;
          </span>
        </Link>

        <Link
          href="/admin/categories"
          className="p-6 rounded-xl border border-border/40 glass glass-hover h-40 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-semibold">
              <FolderPlus size={18} />
              <h2>Manage Categories</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Create new categories, customize descriptions, and set icons.
            </p>
          </div>
          <span className="text-xs font-mono text-blue-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Go to Panel &rarr;
          </span>
        </Link>

        <Link
          href="/admin/footprints"
          className="p-6 rounded-xl border border-border/40 glass glass-hover h-40 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-semibold">
              <Grid size={18} />
              <h2>Manage Footprints</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure package footprints, dimensions, and PCB layouts.
            </p>
          </div>
          <span className="text-xs font-mono text-purple-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Go to Panel &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}

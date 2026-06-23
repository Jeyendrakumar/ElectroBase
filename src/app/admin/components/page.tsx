"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdmin } from "../admin-provider";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Component {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  packageType: string | null;
  footprint: string | null;
}

export default function AdminComponentsPage() {
  const { token } = useAdmin();
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/components?limit=100");
      const data = await res.json();
      setComponents(data.components || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComponents();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/components/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": token || "",
        },
      });
      if (res.ok) {
        toast.success(`${name} has been deleted.`);
        loadComponents();
      } else {
        toast.error("Failed to delete component.");
      }
    } catch (e) {
      toast.error("An error occurred during deletion.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="p-2 hover:bg-muted/40 rounded text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manage Components</h1>
            <p className="text-xs font-mono text-muted-foreground">INVENTORY DATABASE OVERVIEW</p>
          </div>
        </div>
        <Link
          href="/admin/components/new"
          className="flex items-center gap-1 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-mono font-bold transition-colors"
        >
          <Plus size={14} />
          <span>New Component</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/20 border border-border/40 rounded-lg" />
          ))}
        </div>
      ) : components.length > 0 ? (
        <div className="rounded-xl border border-border/40 overflow-hidden glass">
          <table className="w-full text-sm font-mono text-left">
            <thead className="bg-muted/20 border-b border-border/40 text-muted-foreground text-xs">
              <tr>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Manufacturer</th>
                <th className="p-3.5">Package</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {components.map((comp) => (
                <tr key={comp.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                  <td className="p-3.5 font-bold text-foreground">{comp.name}</td>
                  <td className="p-3.5 text-muted-foreground">{comp.category}</td>
                  <td className="p-3.5 text-muted-foreground">{comp.manufacturer}</td>
                  <td className="p-3.5 text-muted-foreground">{comp.packageType || comp.footprint || "—"}</td>
                  <td className="p-3.5 text-right space-x-2">
                    <Link
                      href={`/admin/components/${comp.id}/edit`}
                      className="inline-flex p-1.5 rounded hover:bg-cyan-500/20 text-cyan-400"
                    >
                      <Edit size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(comp.id, comp.name)}
                      className="inline-flex p-1.5 rounded hover:bg-rose-500/20 text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-muted-foreground font-mono text-xs border border-border/40 rounded-xl glass">
          No components registered yet.
        </div>
      )}
    </div>
  );
}

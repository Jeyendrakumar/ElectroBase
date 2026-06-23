"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdmin } from "../admin-provider";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export default function AdminCategoriesPage() {
  const { token } = useAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": token || "",
        },
        body: JSON.stringify({ name, description, icon }),
      });

      if (res.ok) {
        toast.success(editingId ? "Category updated." : "Category created.");
        setName("");
        setDescription("");
        setIcon("");
        setEditingId(null);
        loadCategories();
      } else {
        toast.error("Failed to commit operations.");
      }
    } catch (e) {
      toast.error("An error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-border/40 pb-4">
        <Link href="/admin" className="p-2 hover:bg-muted/40 rounded text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Categories</h1>
          <p className="text-xs font-mono text-muted-foreground">CATEGORY MAP PANEL</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 p-6 rounded-xl border border-border/40 glass h-fit">
          <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit Category" : "Add Category"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">NAME *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Resistor"
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">DESCRIPTION</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about components of this category..."
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground resize-y"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded bg-cyan-500 hover:bg-cyan-600 text-white font-mono text-xs font-bold transition-colors"
            >
              {editingId ? "UPDATE" : "CREATE"}
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground font-mono text-xs animate-pulse">
              LOADING CATEGORIES...
            </div>
          ) : categories.length > 0 ? (
            <div className="rounded-xl border border-border/40 overflow-hidden glass">
              <table className="w-full text-sm font-mono text-left">
                <thead className="bg-muted/20 border-b border-border/40 text-muted-foreground text-xs">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                      <td className="p-3.5 font-bold text-foreground">{cat.name}</td>
                      <td className="p-3.5 text-xs text-muted-foreground">{cat.description || "—"}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setName(cat.name);
                            setDescription(cat.description || "");
                            setIcon(cat.icon || "");
                            setEditingId(cat.id);
                          }}
                          className="inline-flex p-1.5 rounded hover:bg-cyan-500/20 text-cyan-400 mr-2"
                        >
                          <Edit size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground font-mono text-xs border border-border/40 rounded-xl glass">
              No categories registered yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

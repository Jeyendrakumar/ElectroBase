"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "../../admin-provider";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PinInput {
  pinNumber: string;
  pinName: string;
  description: string;
}

interface SpecInput {
  parameter: string;
  value: string;
  unit: string;
}

export default function ComponentFormPage({ params }: { params?: Promise<{ id: string }> }) {
  const router = useRouter();
  const { token } = useAdmin();
  const resolvedParams = params ? use(params) : null;
  const isEdit = !!resolvedParams?.id;

  const [categories, setCategories] = useState<string[]>([]);
  const [footprints, setFootprints] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [description, setDescription] = useState("");
  const [datasheetUrl, setDatasheetUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [footprint, setFootprint] = useState("");
  const [packageType, setPackageType] = useState("");
  const [pinCount, setPinCount] = useState("");
  const [tags, setTags] = useState("");
  const [pins, setPins] = useState<PinInput[]>([]);
  const [specs, setSpecs] = useState<SpecInput[]>([]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const catRes = await fetch("/api/categories");
        const cats = await catRes.json();
        setCategories(cats.map((c: any) => c.name));

        const fpRes = await fetch("/api/footprints");
        const fps = await fpRes.json();
        setFootprints(fps.map((f: any) => f.name));

        if (isEdit && resolvedParams?.id) {
          const compRes = await fetch(`/api/components/${resolvedParams.id}`);
          const comp = await compRes.json();

          setName(comp.name || "");
          setCategory(comp.category || "");
          setManufacturer(comp.manufacturer || "");
          setDescription(comp.description || "");
          setDatasheetUrl(comp.datasheetUrl || "");
          setImageUrl(comp.imageUrl || "");
          setFootprint(comp.footprint || "");
          setPackageType(comp.packageType || "");
          setPinCount(comp.pinCount ? String(comp.pinCount) : "");
          setTags(comp.tags || "");
          setPins(
            (comp.pins || []).map((p: any) => ({
              pinNumber: String(p.pinNumber),
              pinName: p.pinName,
              description: p.description,
            }))
          );
          setSpecs(
            (comp.specifications || []).map((s: any) => ({
              parameter: s.parameter,
              value: s.value,
              unit: s.unit || "",
            }))
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, [isEdit, resolvedParams]);

  const handleAddPin = () => {
    setPins([...pins, { pinNumber: String(pins.length + 1), pinName: "", description: "" }]);
  };

  const handleRemovePin = (idx: number) => {
    setPins(pins.filter((_, i) => i !== idx));
  };

  const handlePinChange = (idx: number, field: keyof PinInput, val: string) => {
    const updated = [...pins];
    updated[idx][field] = val;
    setPins(updated);
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { parameter: "", value: "", unit: "" }]);
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: keyof SpecInput, val: string) => {
    const updated = [...specs];
    updated[idx][field] = val;
    setSpecs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      category,
      manufacturer,
      description,
      datasheetUrl,
      imageUrl,
      footprint,
      packageType,
      pinCount: pinCount ? parseInt(pinCount, 10) : null,
      tags,
      pins: pins.map((p) => ({ ...p, pinNumber: parseInt(p.pinNumber, 10) })),
      specs,
    };

    try {
      const url = isEdit ? `/api/components/${resolvedParams.id}` : "/api/components";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": token || "",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(isEdit ? "Component updated." : "Component created.");
        router.push("/admin/components");
        router.refresh();
      } else {
        toast.error("Failed to commit operations.");
      }
    } catch (e) {
      toast.error("Network request error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 border-b border-border/40 pb-4">
        <Link
          href="/admin/components"
          className="p-2 hover:bg-muted/40 rounded text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Component" : "Create Component"}</h1>
          <p className="text-xs font-mono text-muted-foreground">
            {isEdit ? `UPDATE RECORD // ID: ${resolvedParams.id}` : "RECORD REGISTRATION ENGINE"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border border-border/40 glass">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">COMPONENT NAME *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. NE555"
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">MANUFACTURER *</label>
              <input
                type="text"
                required
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Texas Instruments"
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">CATEGORY *</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
              >
                <option value="" className="bg-slate-900">Select Category</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">PACKAGE TYPE</label>
              <input
                type="text"
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
                placeholder="e.g. SOIC-8 or DIP-8"
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">FOOTPRINT</label>
              <select
                value={footprint}
                onChange={(e) => setFootprint(e.target.value)}
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
              >
                <option value="" className="bg-slate-900">Select Footprint</option>
                {footprints.map((f) => (
                  <option key={f} value={f} className="bg-slate-900">
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">PIN COUNT</label>
              <input
                type="number"
                value={pinCount}
                onChange={(e) => setPinCount(e.target.value)}
                placeholder="8"
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">TAGS (COMMA SEPARATED)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="timer, oscillator, 555"
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">DATASHEET URL</label>
              <input
                type="url"
                value={datasheetUrl}
                onChange={(e) => setDatasheetUrl(e.target.value)}
                placeholder="https://example.com/datasheet.pdf"
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-mono text-muted-foreground block mb-1">DESCRIPTION *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of component functionality, modules..."
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/40 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground resize-y"
            />
          </div>
        </div>

        {/* Pin Configurations Section */}
        <div className="space-y-4 p-6 rounded-xl border border-border/40 glass">
          <div className="flex items-center justify-between border-b border-border/20 pb-2">
            <h2 className="text-lg font-semibold">Pin Configurations</h2>
            <button
              type="button"
              onClick={handleAddPin}
              className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300"
            >
              <Plus size={14} /> Add Pin
            </button>
          </div>

          {pins.length > 0 ? (
            <div className="space-y-3">
              {pins.map((p, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input
                    type="number"
                    required
                    value={p.pinNumber}
                    onChange={(e) => handlePinChange(idx, "pinNumber", e.target.value)}
                    placeholder="Pin #"
                    className="w-16 py-1.5 px-2.5 rounded border border-border/40 bg-card/30 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    value={p.pinName}
                    onChange={(e) => handlePinChange(idx, "pinName", e.target.value)}
                    placeholder="Name (e.g. VCC)"
                    className="w-32 py-1.5 px-2.5 rounded border border-border/40 bg-card/30 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={p.description}
                    onChange={(e) => handlePinChange(idx, "description", e.target.value)}
                    placeholder="Description / Pin purpose"
                    className="flex-1 py-1.5 px-2.5 rounded border border-border/40 bg-card/30 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePin(idx)}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground font-mono">
              No pins configured yet.
            </div>
          )}
        </div>

        {/* Specifications Section */}
        <div className="space-y-4 p-6 rounded-xl border border-border/40 glass">
          <div className="flex items-center justify-between border-b border-border/20 pb-2">
            <h2 className="text-lg font-semibold">Specifications</h2>
            <button
              type="button"
              onClick={handleAddSpec}
              className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300"
            >
              <Plus size={14} /> Add Spec
            </button>
          </div>

          {specs.length > 0 ? (
            <div className="space-y-3">
              {specs.map((s, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input
                    type="text"
                    required
                    value={s.parameter}
                    onChange={(e) => handleSpecChange(idx, "parameter", e.target.value)}
                    placeholder="Parameter (e.g. Voltage)"
                    className="w-1/3 py-1.5 px-2.5 rounded border border-border/40 bg-card/30 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    value={s.value}
                    onChange={(e) => handleSpecChange(idx, "value", e.target.value)}
                    placeholder="Value (e.g. 5)"
                    className="w-1/3 py-1.5 px-2.5 rounded border border-border/40 bg-card/30 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={s.unit}
                    onChange={(e) => handleSpecChange(idx, "unit", e.target.value)}
                    placeholder="Unit (e.g. V)"
                    className="w-1/4 py-1.5 px-2.5 rounded border border-border/40 bg-card/30 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground font-mono">
              No specifications added yet.
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-end">
          <Link
            href="/admin/components"
            className="py-2.5 px-5 rounded-lg border border-border/40 hover:bg-muted/40 font-mono text-xs font-bold transition-colors"
          >
            CANCEL
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-6 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-mono text-xs font-bold transition-colors"
          >
            {loading ? "COMMITTING ACTIONS..." : isEdit ? "UPDATE RECORD" : "CREATE RECORD"}
          </button>
        </div>
      </form>
    </div>
  );
}

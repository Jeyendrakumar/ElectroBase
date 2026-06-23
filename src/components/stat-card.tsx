import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  colorClass?: string;
  description?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  colorClass = "text-cyan-400 border-cyan-500/20",
  description,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl glass border border-border/40 p-6 flex items-center justify-between group">
      {/* Absolute glow effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-500" />

      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground block font-sans">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight font-mono text-foreground">
            {value}
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground/80 mt-1">{description}</p>
        )}
      </div>

      <div className={cn("p-3.5 rounded-lg bg-muted/20 border transition-all duration-300 group-hover:scale-105", colorClass)}>
        <Icon size={24} className="stroke-[1.5]" />
      </div>
    </div>
  );
}

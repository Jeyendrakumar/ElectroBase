"use client";

import { cn } from "@/lib/utils";

interface Pin {
  pinNumber: number;
  pinName: string;
  description: string;
}

interface PinoutVisualizerProps {
  pins: Pin[];
  pinCount: number | null;
  footprint: string | null;
  hoveredPin: number | null;
  onHoverPin: (pinNum: number | null) => void;
}

export function PinoutVisualizer({
  pins,
  pinCount,
  footprint,
  hoveredPin,
  onHoverPin,
}: PinoutVisualizerProps) {
  const totalPins = pinCount || pins.length || 8;
  const fpType = (footprint || "").toUpperCase();

  // Helper to find pin details
  const getPin = (num: number) => pins.find((p) => p.pinNumber === num);

  // 1. Render 3-Lead Transistor / Regulator (TO-220, TO-92, SOT-23)
  if (totalPins === 3 || fpType.includes("TO-220") || fpType.includes("TO-92") || fpType.includes("SOT-23")) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-border/40 rounded-xl glass bg-slate-950/20 max-w-sm mx-auto">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">
          {fpType || "3-LEAD PACKAGE"}
        </span>
        
        {/* TO-220 visual block */}
        <div className="relative w-32 h-44 flex flex-col items-center">
          {/* Heatsink Tab for TO-220 */}
          {fpType.includes("TO-220") && (
            <div className="w-24 h-12 bg-zinc-700/80 rounded-t-md border border-zinc-600 flex items-center justify-center relative">
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-zinc-500 absolute top-3" />
            </div>
          )}

          {/* Main body */}
          <div className="w-28 h-20 bg-slate-800 border-2 border-zinc-600 rounded-b-md flex items-center justify-center relative">
            <span className="text-xs font-bold text-cyan-400 font-mono">3-LEAD</span>
          </div>

          {/* Leads */}
          <div className="flex justify-around w-24 px-2 mt-0.5 h-16 relative">
            {[1, 2, 3].map((num) => {
              const pin = getPin(num);
              const isHovered = hoveredPin === num;
              return (
                <div
                  key={num}
                  onMouseEnter={() => onHoverPin(num)}
                  onMouseLeave={() => onHoverPin(null)}
                  className="flex flex-col items-center h-full group cursor-pointer relative"
                >
                  {/* Metal lead */}
                  <div
                    className={cn(
                      "w-1.5 h-12 bg-zinc-500 rounded-b transition-all",
                      isHovered ? "bg-cyan-400 shadow-md shadow-cyan-400/50" : "bg-zinc-500"
                    )}
                  />
                  {/* Pin label bubble */}
                  <span
                    className={cn(
                      "mt-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-all",
                      isHovered ? "bg-cyan-500 text-white" : "bg-muted/40 text-muted-foreground"
                    )}
                  >
                    {num}
                  </span>
                  {/* Hover Tooltip */}
                  {isHovered && pin && (
                    <div className="absolute top-16 z-30 w-32 bg-slate-950 border border-cyan-500/50 p-2 rounded text-[10px] font-sans text-center shadow-lg">
                      <div className="font-bold text-cyan-400">{pin.pinName}</div>
                      <div className="text-muted-foreground truncate">{pin.description}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Header / Single Row (Modules, connectors)
  const isModule = fpType.includes("MODULE") || totalPins < 6;
  if (isModule) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-border/40 rounded-xl glass bg-slate-950/20 max-w-sm mx-auto">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">
          {fpType || "HEADER CONNECTOR"}
        </span>

        {/* Pin rows */}
        <div className="flex flex-col items-center bg-slate-800 border-2 border-zinc-600 p-4 rounded-lg w-40 gap-3">
          {Array.from({ length: totalPins }).map((_, i) => {
            const num = i + 1;
            const pin = getPin(num);
            const isHovered = hoveredPin === num;
            return (
              <div
                key={num}
                onMouseEnter={() => onHoverPin(num)}
                onMouseLeave={() => onHoverPin(null)}
                className={cn(
                  "flex items-center gap-3 w-full p-1.5 rounded border transition-all cursor-pointer",
                  isHovered ? "bg-cyan-500/20 border-cyan-500/40" : "bg-card/30 border-transparent"
                )}
              >
                {/* Visual pin circle */}
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border flex items-center justify-center text-[8px] font-mono font-bold shrink-0",
                    isHovered ? "bg-cyan-500 border-cyan-400 text-white" : "bg-slate-900 border-zinc-500 text-muted-foreground"
                  )}
                >
                  {num}
                </div>
                <div className="text-[10px] font-mono truncate text-foreground font-semibold">
                  {pin?.pinName || `P${num}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Render DIP / SOIC IC package (Dual In-Line)
  const halfPins = Math.ceil(totalPins / 2);
  const leftPins = Array.from({ length: halfPins }).map((_, i) => i + 1);
  const rightPins = Array.from({ length: halfPins })
    .map((_, i) => totalPins - i)
    .reverse();

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-border/40 rounded-xl glass bg-slate-950/20 max-w-sm mx-auto">
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-6">
        {fpType || "DIP IC PACKAGE"}
      </span>

      {/* Chip packaging visual container */}
      <div className="flex items-center relative py-6">
        
        {/* Left Pins stack */}
        <div className="flex flex-col justify-around h-64 pr-1 gap-1">
          {leftPins.map((num) => {
            const pin = getPin(num);
            const isHovered = hoveredPin === num;
            return (
              <div
                key={num}
                onMouseEnter={() => onHoverPin(num)}
                onMouseLeave={() => onHoverPin(null)}
                className="flex items-center gap-1.5 group cursor-pointer"
              >
                <span className={cn("text-[9px] font-mono transition-colors", isHovered ? "text-cyan-400 font-bold" : "text-muted-foreground")}>
                  {pin?.pinName || `P${num}`}
                </span>
                {/* Pin lead */}
                <div
                  className={cn(
                    "w-3.5 h-2 rounded-l transition-all",
                    isHovered ? "bg-cyan-400 shadow-md shadow-cyan-400/50" : "bg-zinc-500"
                  )}
                />
                <span className={cn("text-[9px] font-mono font-bold px-1 rounded-sm", isHovered ? "bg-cyan-500 text-white" : "bg-slate-900 text-muted-foreground/80")}>
                  {num}
                </span>
              </div>
            );
          })}
        </div>

        {/* IC Body */}
        <div className="w-24 h-72 bg-slate-800 border-2 border-zinc-600 rounded-lg flex flex-col items-center relative justify-center px-2">
          {/* Top index notch */}
          <div className="absolute top-0 w-8 h-4 bg-slate-950 border-b border-l border-r border-zinc-600 rounded-b-md" />
          {/* Text labels on chip */}
          <div className="text-[11px] font-mono font-bold tracking-wider text-foreground select-none text-center">
            {pins[0] ? pins[0].pinName : "IC"}
          </div>
          <div className="text-[9px] font-mono text-muted-foreground/60 select-none uppercase tracking-widest pt-1">
            {totalPins} PINS
          </div>
        </div>

        {/* Right Pins stack */}
        <div className="flex flex-col justify-around h-64 pl-1 gap-1">
          {rightPins.map((num) => {
            const pin = getPin(num);
            const isHovered = hoveredPin === num;
            return (
              <div
                key={num}
                onMouseEnter={() => onHoverPin(num)}
                onMouseLeave={() => onHoverPin(null)}
                className="flex items-center gap-1.5 group cursor-pointer"
              >
                <span className={cn("text-[9px] font-mono font-bold px-1 rounded-sm", isHovered ? "bg-cyan-500 text-white" : "bg-slate-900 text-muted-foreground/80")}>
                  {num}
                </span>
                {/* Pin lead */}
                <div
                  className={cn(
                    "w-3.5 h-2 rounded-r transition-all",
                    isHovered ? "bg-cyan-400 shadow-md shadow-cyan-400/50" : "bg-zinc-500"
                  )}
                />
                <span className={cn("text-[9px] font-mono transition-colors", isHovered ? "text-cyan-400 font-bold" : "text-muted-foreground")}>
                  {pin?.pinName || `P${num}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

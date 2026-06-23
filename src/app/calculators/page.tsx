"use client";

import { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Activity, Zap, Cpu, Sliders, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Resistor bands color constants
const RESISTOR_COLORS = [
  { name: "Black", hex: "#000000", textHex: "#ffffff", value: 0, multiplier: 1, tolerance: null },
  { name: "Brown", hex: "#8B4513", textHex: "#ffffff", value: 1, multiplier: 10, tolerance: 1 },
  { name: "Red", hex: "#FF0000", textHex: "#ffffff", value: 2, multiplier: 100, tolerance: 2 },
  { name: "Orange", hex: "#FFA500", textHex: "#000000", value: 3, multiplier: 1000, tolerance: null },
  { name: "Yellow", hex: "#FFFF00", textHex: "#000000", value: 4, multiplier: 10000, tolerance: null },
  { name: "Green", hex: "#008000", textHex: "#ffffff", value: 5, multiplier: 100000, tolerance: 0.5 },
  { name: "Blue", hex: "#0000FF", textHex: "#ffffff", value: 6, multiplier: 1000000, tolerance: 0.25 },
  { name: "Violet", hex: "#EE82EE", textHex: "#000000", value: 7, multiplier: 10000000, tolerance: 0.1 },
  { name: "Grey", hex: "#808080", textHex: "#ffffff", value: 8, multiplier: 100000000, tolerance: 0.05 },
  { name: "White", hex: "#FFFFFF", textHex: "#000000", value: 9, multiplier: 1000000000, tolerance: null },
  { name: "Gold", hex: "#D4AF37", textHex: "#000000", value: null, multiplier: 0.1, tolerance: 5 },
  { name: "Silver", hex: "#C0C0C0", textHex: "#000000", value: null, multiplier: 0.01, tolerance: 10 }
];

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState<"resistor" | "555" | "lm317" | "led">("resistor");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs items={[{ label: "Calculators" }]} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Interactive Engineering Calculators</h1>
        <p className="text-muted-foreground text-sm">
          Solve standard electronics circuit designs, calculations, and color decoders instantly.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border/40 overflow-x-auto gap-2 pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab("resistor")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-all shrink-0 font-mono",
            activeTab === "resistor"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Resistor Color Code
        </button>
        <button
          onClick={() => setActiveTab("555")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-all shrink-0 font-mono",
            activeTab === "555"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          555 Timer Astable
        </button>
        <button
          onClick={() => setActiveTab("lm317")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-all shrink-0 font-mono",
            activeTab === "lm317"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          LM317 Regulator
        </button>
        <button
          onClick={() => setActiveTab("led")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-all shrink-0 font-mono",
            activeTab === "led"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          LED Series Resistor
        </button>
      </div>

      {/* Calculator Body Panels */}
      <div className="rounded-xl border border-border/40 glass p-6 min-h-[400px]">
        {activeTab === "resistor" && <ResistorCalculator />}
        {activeTab === "555" && <TimerCalculator />}
        {activeTab === "lm317" && <LMRcalculator />}
        {activeTab === "led" && <LedCalculator />}
      </div>
    </div>
  );
}

// ── Resistor Calculator ──
function ResistorCalculator() {
  const [bandsCount, setBandsCount] = useState<4 | 5>(4);
  const [band1, setBand1] = useState(1); // Brown
  const [band2, setBand2] = useState(0); // Black
  const [band3, setBand3] = useState(2); // Red (Only used in 5 band, set to 0 initially)
  const [multiplier, setMultiplier] = useState(2); // Red (x100)
  const [tolerance, setTolerance] = useState(10); // Gold (5%)

  const calculateResistance = () => {
    const val1 = RESISTOR_COLORS[band1].value ?? 0;
    const val2 = RESISTOR_COLORS[band2].value ?? 0;
    const mult = RESISTOR_COLORS[multiplier].multiplier ?? 1;
    const tol = RESISTOR_COLORS[tolerance].tolerance ?? 5;

    let base = 0;
    if (bandsCount === 4) {
      base = val1 * 10 + val2;
    } else {
      const val3 = RESISTOR_COLORS[band3].value ?? 0;
      base = val1 * 100 + val2 * 10 + val3;
    }

    const resistance = base * mult;
    const minVal = resistance * (1 - tol / 100);
    const maxVal = resistance * (1 + tol / 100);

    return { resistance, tol, minVal, maxVal };
  };

  const formatValue = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2).replace(/\.00$/, "")} GΩ`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2).replace(/\.00$/, "")} MΩ`;
    if (num >= 1000) return `${(num / 1000).toFixed(2).replace(/\.00$/, "")} kΩ`;
    return `${num.toFixed(1).replace(/\.0$/, "")} Ω`;
  };

  const { resistance, tol, minVal, maxVal } = calculateResistance();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sliders size={18} className="text-cyan-400" />
            <span>Select Band Colors</span>
          </h2>
          <div className="flex border border-border/40 rounded-lg overflow-hidden text-xs font-mono">
            <button
              onClick={() => setBandsCount(4)}
              className={cn("px-3 py-1.5 transition-colors", bandsCount === 4 ? "bg-cyan-500 text-white" : "hover:bg-muted/30 text-muted-foreground")}
            >
              4-Band
            </button>
            <button
              onClick={() => setBandsCount(5)}
              className={cn("px-3 py-1.5 transition-colors", bandsCount === 5 ? "bg-cyan-500 text-white" : "hover:bg-muted/30 text-muted-foreground")}
            >
              5-Band
            </button>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">1st Band (1st Digit)</label>
            <select
              value={band1}
              onChange={(e) => setBand1(Number(e.target.value))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
            >
              {RESISTOR_COLORS.filter(c => c.value !== null).map((c, i) => (
                <option key={c.name} value={RESISTOR_COLORS.indexOf(c)} className="bg-slate-950 text-white">
                  {c.name} ({c.value})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">2nd Band (2nd Digit)</label>
            <select
              value={band2}
              onChange={(e) => setBand2(Number(e.target.value))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
            >
              {RESISTOR_COLORS.filter(c => c.value !== null).map((c, i) => (
                <option key={c.name} value={RESISTOR_COLORS.indexOf(c)} className="bg-slate-950 text-white">
                  {c.name} ({c.value})
                </option>
              ))}
            </select>
          </div>

          {bandsCount === 5 && (
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">3rd Band (3rd Digit)</label>
              <select
                value={band3}
                onChange={(e) => setBand3(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
              >
                {RESISTOR_COLORS.filter(c => c.value !== null).map((c, i) => (
                  <option key={c.name} value={RESISTOR_COLORS.indexOf(c)} className="bg-slate-950 text-white">
                    {c.name} ({c.value})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Multiplier Band</label>
            <select
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
            >
              {RESISTOR_COLORS.map((c, i) => (
                <option key={c.name} value={i} className="bg-slate-950 text-white">
                  {c.name} (x{c.multiplier})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Tolerance Band</label>
            <select
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
            >
              {RESISTOR_COLORS.filter(c => c.tolerance !== null).map((c, i) => (
                <option key={c.name} value={RESISTOR_COLORS.indexOf(c)} className="bg-slate-950 text-white">
                  {c.name} (±{c.tolerance}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visual Render Column */}
      <div className="flex flex-col justify-center items-center gap-6 p-4 rounded-xl border border-border/25 bg-slate-950/20">
        <h3 className="text-sm font-bold font-mono text-cyan-400 tracking-wider uppercase">Visual Representation</h3>

        {/* Resistor body diagram */}
        <div className="relative w-72 h-16 flex items-center justify-center">
          {/* Wire lead left */}
          <div className="absolute left-0 w-24 h-1 bg-zinc-600 rounded" />
          {/* Wire lead right */}
          <div className="absolute right-0 w-24 h-1 bg-zinc-600 rounded" />

          {/* Resistor main body */}
          <div className="relative w-48 h-10 bg-slate-700/60 border border-zinc-600 rounded-lg flex justify-between px-6 items-center">
            {/* Color bands overlay */}
            <div className="w-2.5 h-10" style={{ backgroundColor: RESISTOR_COLORS[band1].hex }} />
            <div className="w-2.5 h-10" style={{ backgroundColor: RESISTOR_COLORS[band2].hex }} />
            {bandsCount === 5 && (
              <div className="w-2.5 h-10" style={{ backgroundColor: RESISTOR_COLORS[band3].hex }} />
            )}
            <div className="w-2.5 h-10" style={{ backgroundColor: RESISTOR_COLORS[multiplier].hex }} />
            <div className="w-2.5 h-10" style={{ backgroundColor: RESISTOR_COLORS[tolerance].hex }} />
          </div>
        </div>

        {/* Output */}
        <div className="w-full text-center space-y-2 mt-4">
          <div className="text-sm text-muted-foreground font-mono">Calculated Resistance</div>
          <div className="text-4xl font-bold font-mono text-cyan-400">{formatValue(resistance)}</div>
          <div className="text-xs text-muted-foreground font-mono">
            Tolerance Range: ±{tol}% ({formatValue(minVal)} to {formatValue(maxVal)})
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 555 Timer Astable Calculator ──
function TimerCalculator() {
  const [r1, setR1] = useState(10); // kOhms
  const [r2, setR2] = useState(47); // kOhms
  const [c1, setC1] = useState(10); // uF

  const calculateParameters = () => {
    const R1_Ohm = r1 * 1000;
    const R2_Ohm = r2 * 1000;
    const C_Farad = c1 * 0.000001;

    if (R1_Ohm <= 0 || R2_Ohm <= 0 || C_Farad <= 0) {
      return { freq: 0, period: 0, duty: 0, tHigh: 0, tLow: 0 };
    }

    const tHigh = 0.693 * (R1_Ohm + R2_Ohm) * C_Farad;
    const tLow = 0.693 * R2_Ohm * C_Farad;
    const period = tHigh + tLow;
    const freq = 1 / period;
    const duty = (tHigh / period) * 100;

    return { freq, period: period * 1000, duty, tHigh: tHigh * 1000, tLow: tLow * 1000 };
  };

  const { freq, period, duty, tHigh, tLow } = calculateParameters();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap size={18} className="text-cyan-400" />
          <span>Calculations Settings</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Resistor R1 (kΩ)</label>
            <input
              type="number"
              value={r1}
              onChange={(e) => setR1(Math.max(0.1, Number(e.target.value)))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Resistor R2 (kΩ)</label>
            <input
              type="number"
              value={r2}
              onChange={(e) => setR2(Math.max(0.1, Number(e.target.value)))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Capacitor C1 (μF)</label>
            <input
              type="number"
              value={c1}
              onChange={(e) => setC1(Math.max(0.001, Number(e.target.value)))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/20 bg-muted/20 text-xs text-muted-foreground space-y-2 leading-relaxed">
          <div className="flex items-center gap-1 font-bold text-foreground">
            <Info size={14} className="text-cyan-400 shrink-0" />
            <span>Formula Reference</span>
          </div>
          <p className="font-mono text-[11px] space-y-1">
            t_high = 0.693 &times; (R1 + R2) &times; C1<br />
            t_low = 0.693 &times; R2 &times; C1<br />
            Frequency = 1.44 / ((R1 + 2 &times; R2) &times; C1)
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center gap-6 p-6 rounded-xl border border-border/25 bg-slate-950/20">
        <h3 className="text-sm font-bold font-mono text-cyan-400 tracking-wider uppercase">Results Summary</h3>

        <div className="grid grid-cols-2 gap-4 w-full text-center">
          <div className="p-3 border border-border/30 rounded-lg">
            <div className="text-xs text-muted-foreground font-mono">Frequency</div>
            <div className="text-lg font-bold text-cyan-400 font-mono">
              {freq >= 1000 ? `${(freq / 1000).toFixed(3)} kHz` : `${freq.toFixed(1)} Hz`}
            </div>
          </div>
          <div className="p-3 border border-border/30 rounded-lg">
            <div className="text-xs text-muted-foreground font-mono">Duty Cycle</div>
            <div className="text-lg font-bold text-cyan-400 font-mono">{duty.toFixed(1)} %</div>
          </div>
          <div className="p-3 border border-border/30 rounded-lg">
            <div className="text-xs text-muted-foreground font-mono">High Period (t1)</div>
            <div className="text-sm font-semibold text-foreground font-mono">{tHigh.toFixed(2)} ms</div>
          </div>
          <div className="p-3 border border-border/30 rounded-lg">
            <div className="text-xs text-muted-foreground font-mono">Low Period (t2)</div>
            <div className="text-sm font-semibold text-foreground font-mono">{tLow.toFixed(2)} ms</div>
          </div>
        </div>

        {/* Waveform Drawing simulation */}
        <div className="w-full bg-slate-950/60 p-4 border border-border/30 rounded-lg flex flex-col gap-2">
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">Pulse Output Shape (Waveform)</span>
          <div className="w-full h-16 relative flex items-end">
            <svg className="w-full h-full text-cyan-500" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d="M 0,25 L 15,25 L 15,5 L 45,5 L 45,25 L 65,25 L 65,5 L 95,5 L 95,25 L 100,25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>High duration: {tHigh.toFixed(1)}ms</span>
            <span>Period: {period.toFixed(1)}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LM317 Voltage Regulator Calculator ──
function LMRcalculator() {
  const [vref, setVref] = useState(1.25); // V
  const [r1, setR1] = useState(240); // Ohms
  const [r2, setR2] = useState(2000); // Ohms

  const calculateVout = () => {
    if (r1 <= 0) return 0;
    // Vout = Vref * (1 + R2 / R1) + Iadj * R2 (where Iadj is typically 50uA - neglected in basic calculation)
    return vref * (1 + r2 / r1);
  };

  const vout = calculateVout();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sliders size={18} className="text-cyan-400" />
          <span>Adjust Regulators Parameters</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Reference Voltage Vref (V)</label>
            <input
              type="number"
              value={vref}
              step="0.01"
              onChange={(e) => setVref(Math.max(0.5, Number(e.target.value)))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Resistor R1 (Ω) (Typically 240Ω)</label>
            <input
              type="number"
              value={r1}
              onChange={(e) => setR1(Math.max(1, Number(e.target.value)))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Resistor R2 (Ω)</label>
            <input
              type="number"
              value={r2}
              onChange={(e) => setR2(Math.max(0, Number(e.target.value)))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center gap-6 p-6 rounded-xl border border-border/25 bg-slate-950/20">
        <h3 className="text-sm font-bold font-mono text-cyan-400 tracking-wider uppercase">Calculated Output</h3>

        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground font-mono">Regulated Vout</div>
          <div className="text-5xl font-bold font-mono text-cyan-400">{vout.toFixed(2)} V</div>
          <p className="text-xs text-muted-foreground font-mono max-w-xs leading-relaxed mx-auto pt-2">
            Providing stable regulated output voltage based on resistance ratio:
            Vout = Vref &times; (1 + R2 / R1).
          </p>
        </div>

        {/* Diagram schematic representation */}
        <div className="p-4 bg-slate-950/60 border border-border/30 rounded-lg w-full flex items-center justify-center">
          <svg className="w-56 h-28 text-cyan-400" viewBox="0 0 100 50" fill="none">
            <rect x="35" y="5" width="30" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <text x="50" y="14" fill="currentColor" fontSize="6" textAnchor="middle">LM317</text>
            {/* Input wire */}
            <line x1="10" y1="12" x2="35" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <text x="15" y="8" fill="currentColor" fontSize="4">Vin</text>
            {/* Output wire */}
            <line x1="65" y1="12" x2="90" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <text x="85" y="8" fill="currentColor" fontSize="4">Vout</text>
            {/* Adjust wire */}
            <line x1="50" y1="20" x2="50" y2="35" stroke="currentColor" strokeWidth="1.5" />
            <text x="54" y="27" fill="currentColor" fontSize="4">Adj</text>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── LED Series Resistor Calculator ──
function LedCalculator() {
  const [sourceVoltage, setSourceVoltage] = useState(9); // V
  const [ledVoltage, setLedVoltage] = useState(2.0); // V (Red standard LED)
  const [ledCurrent, setLedCurrent] = useState(20); // mA

  const calculateResistor = () => {
    if (sourceVoltage <= ledVoltage) {
      return { resistance: 0, power: 0, rating: "N/A (Vs <= Vf)" };
    }
    const currentA = ledCurrent / 1000;
    const resistance = (sourceVoltage - ledVoltage) / currentA;
    const power = (sourceVoltage - ledVoltage) * currentA;

    let rating = "1/4 W (0.25W)";
    if (power > 0.25) rating = "1/2 W (0.5W)";
    if (power > 0.5) rating = "1 W";
    if (power > 1.0) rating = "2 W+";

    return { resistance, power, rating };
  };

  const { resistance, power, rating } = calculateResistor();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap size={18} className="text-cyan-400" />
          <span>Circuit Specifications</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Source Voltage (V)</label>
            <input
              type="number"
              value={sourceVoltage}
              onChange={(e) => setSourceVoltage(Math.max(0.1, Number(e.target.value)))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">LED Forward Voltage Vf (V)</label>
            <input
              type="number"
              value={ledVoltage}
              step="0.1"
              onChange={(e) => setLedVoltage(Math.max(0.1, Number(e.target.value)))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Desired LED Current (mA)</label>
            <input
              type="number"
              value={ledCurrent}
              onChange={(e) => setLedCurrent(Math.max(0.1, Number(e.target.value)))}
              className="w-full py-2 px-3 rounded-md border border-border/40 bg-card/45 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center gap-6 p-6 rounded-xl border border-border/25 bg-slate-950/20">
        <h3 className="text-sm font-bold font-mono text-cyan-400 tracking-wider uppercase">Results Summary</h3>

        <div className="w-full text-center space-y-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground font-mono">Recommended Resistor</div>
            <div className="text-4xl font-bold font-mono text-cyan-400">
              {resistance > 0 ? `${resistance.toFixed(1)} Ω` : "0 Ω"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border/25 pt-4">
            <div>
              <div className="text-xs text-muted-foreground font-mono">Power Dissipated</div>
              <div className="text-base font-semibold text-foreground font-mono">
                {(power * 1000).toFixed(1)} mW
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-mono">Suggested Power Rating</div>
              <div className="text-base font-semibold text-foreground font-mono">{rating}</div>
            </div>
          </div>
        </div>

        {/* Schematic Simulation */}
        <div className="w-full p-4 bg-slate-950/60 border border-border/30 rounded-lg flex justify-center">
          <svg className="w-56 h-28 text-cyan-400" viewBox="0 0 100 50" fill="none">
            {/* Resistor */}
            <path d="M 10,25 L 30,25 L 34,20 L 38,30 L 42,20 L 46,30 L 50,20 L 54,30 L 58,25 L 70,25" stroke="currentColor" strokeWidth="1.5" />
            {/* LED */}
            <path d="M 70,25 L 75,18 L 75,32 Z" fill="currentColor" />
            <line x1="75" y1="18" x2="75" y2="32" stroke="currentColor" strokeWidth="1.5" />
            <line x1="75" y1="25" x2="90" y2="25" stroke="currentColor" strokeWidth="1.5" />
            {/* Arrows */}
            <line x1="78" y1="12" x2="84" y2="8" stroke="currentColor" strokeWidth="1" />
            <polygon points="84,8 80,9 83,11" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}

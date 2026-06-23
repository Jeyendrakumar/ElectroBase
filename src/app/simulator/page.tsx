"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  RotateCcw,
  Trash2,
  Cpu,
  Zap,
  Sliders,
  AlertTriangle,
  Activity,
  Info,
  RotateCw,
  Save,
  FolderOpen,
  Volume2,
  VolumeX
} from "lucide-react";

// ----------------------------------------------------
// TypeScript Type Definitions
// ----------------------------------------------------

type ComponentType =
  | "battery"
  | "resistor"
  | "led"
  | "switch"
  | "button"
  | "timer555"
  | "gateNot"
  | "gateAnd"
  | "gateOr"
  | "ground"
  | "capacitor"
  | "potentiometer"
  | "buzzer"
  | "voltmeter"
  | "ldr"
  | "transistor";

interface ComponentInstance {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  label: string;
  value: number; // Volts for battery, Ohms for resistor, Frequency for buzzer, position % for potentiometer, uF for capacitor, ambient light % for ldr
  angle: number; // Rotation angle (0, 90, 180, 270)
  state: {
    toggled?: boolean; // switch state
    pressed?: boolean; // button state
    blown?: boolean; // LED blown state
    lit?: boolean; // LED light state
    outputHigh?: boolean; // Gate / 555 output state
    voltageReadout?: number; // Voltmeter measured volts
    capacitorVoltage?: number; // Capacitor stored potential difference
  };
  color?: string; // LED color (red, green, blue, yellow)
}

interface PinConfig {
  pinId: string;
  label: string;
  x: number; // relative x position (unrotated)
  y: number; // relative y position (unrotated)
}

interface WireConnection {
  id: string;
  from: {
    componentId: string;
    pinId: string;
  };
  to: {
    componentId: string;
    pinId: string;
  };
}

interface LogMessage {
  id: string;
  timestamp: string;
  text: string;
  type: "info" | "success" | "warning" | "error";
}

// ----------------------------------------------------
// Component Schemas (Sizes & Pins)
// ----------------------------------------------------

function getComponentSize(type: ComponentType): { w: number; h: number } {
  switch (type) {
    case "timer555": return { w: 100, h: 120 };
    case "ground": return { w: 60, h: 60 };
    case "transistor": return { w: 80, h: 80 };
    case "gateAnd":
    case "gateOr": return { w: 90, h: 80 };
    case "led":
    case "gateNot":
    case "potentiometer":
    case "buzzer":
    case "ldr":
    case "voltmeter": return { w: 80, h: 60 };
    case "battery": return { w: 80, h: 80 };
    case "resistor":
    case "capacitor":
    case "switch":
    case "button": return { w: 80, h: 40 };
    default: return { w: 80, h: 40 };
  }
}

const PIN_SCHEMAS: Record<ComponentType, PinConfig[]> = {
  battery: [
    { pinId: "pos", label: "Positive (+)", x: 40, y: 10 },
    { pinId: "neg", label: "Negative (-)", x: 40, y: 70 }
  ],
  resistor: [
    { pinId: "p1", label: "Pin 1", x: 10, y: 20 },
    { pinId: "p2", label: "Pin 2", x: 90, y: 20 }
  ],
  led: [
    { pinId: "anode", label: "Anode (+)", x: 15, y: 30 },
    { pinId: "cathode", label: "Cathode (-)", x: 65, y: 30 }
  ],
  switch: [
    { pinId: "p1", label: "Terminal 1", x: 10, y: 20 },
    { pinId: "p2", label: "Terminal 2", x: 70, y: 20 }
  ],
  button: [
    { pinId: "p1", label: "Terminal 1", x: 10, y: 20 },
    { pinId: "p2", label: "Terminal 2", x: 70, y: 20 }
  ],
  timer555: [
    { pinId: "GND", label: "GND (1)", x: 10, y: 30 },
    { pinId: "TRIG", label: "TRIG (2)", x: 10, y: 60 },
    { pinId: "RESET", label: "RESET (4)", x: 10, y: 90 },
    { pinId: "OUT", label: "OUT (3)", x: 90, y: 60 },
    { pinId: "VCC", label: "VCC (8)", x: 90, y: 30 }
  ],
  gateNot: [
    { pinId: "in", label: "Input", x: 10, y: 30 },
    { pinId: "out", label: "Output", x: 70, y: 30 }
  ],
  gateAnd: [
    { pinId: "in1", label: "Input A", x: 10, y: 25 },
    { pinId: "in2", label: "Input B", x: 10, y: 55 },
    { pinId: "out", label: "Output", x: 80, y: 40 }
  ],
  gateOr: [
    { pinId: "in1", label: "Input A", x: 10, y: 25 },
    { pinId: "in2", label: "Input B", x: 10, y: 55 },
    { pinId: "out", label: "Output", x: 80, y: 40 }
  ],
  ground: [
    { pinId: "gnd", label: "GND", x: 30, y: 15 }
  ],
  capacitor: [
    { pinId: "p1", label: "Pin 1", x: 10, y: 20 },
    { pinId: "p2", label: "Pin 2", x: 70, y: 20 }
  ],
  potentiometer: [
    { pinId: "p1", label: "Terminal 1", x: 10, y: 30 },
    { pinId: "wiper", label: "Wiper", x: 40, y: 10 },
    { pinId: "p2", label: "Terminal 2", x: 70, y: 30 }
  ],
  buzzer: [
    { pinId: "pos", label: "Positive (+)", x: 25, y: 10 },
    { pinId: "neg", label: "Negative (-)", x: 55, y: 10 }
  ],
  voltmeter: [
    { pinId: "pos", label: "Probe +", x: 15, y: 30 },
    { pinId: "neg", label: "Probe -", x: 65, y: 30 }
  ],
  ldr: [
    { pinId: "p1", label: "Pin 1", x: 10, y: 30 },
    { pinId: "p2", label: "Pin 2", x: 70, y: 30 }
  ],
  transistor: [
    { pinId: "collector", label: "Collector (C)", x: 40, y: 10 },
    { pinId: "base", label: "Base (B)", x: 10, y: 40 },
    { pinId: "emitter", label: "Emitter (E)", x: 40, y: 70 }
  ]
};

// ----------------------------------------------------
// Resistor Color Bands Helper
// ----------------------------------------------------
function getResistorBands(value: number): string[] {
  if (value <= 0) return ["black", "black", "black"];
  let digits = "";
  let multiplier = 0;
  if (value < 10) {
    digits = (value * 10).toFixed(0).padStart(2, "0");
    multiplier = -1;
  } else {
    const exp = Math.floor(Math.log10(value));
    const firstTwo = Math.floor(value / Math.pow(10, exp - 1));
    digits = firstTwo.toString().padStart(2, "0");
    multiplier = exp - 1;
  }
  const colorMap = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "gray", "white"];
  const band1 = colorMap[parseInt(digits[0])] || "black";
  const band2 = colorMap[parseInt(digits[1])] || "black";
  let band3 = "black";
  if (multiplier === -1) band3 = "gold";
  else if (multiplier === -2) band3 = "silver";
  else band3 = colorMap[multiplier] || "black";
  return [band1, band2, band3, "gold"];
}

const BAND_COLOR_CLASSES: Record<string, string> = {
  black: "bg-black border-neutral-700",
  brown: "bg-amber-900 border-amber-950",
  red: "bg-red-600 border-red-800",
  orange: "bg-orange-500 border-orange-700",
  yellow: "bg-yellow-400 border-yellow-600",
  green: "bg-green-600 border-green-800",
  blue: "bg-blue-600 border-blue-800",
  violet: "bg-violet-500 border-violet-700",
  gray: "bg-gray-500 border-gray-700",
  white: "bg-white border-gray-300",
  gold: "bg-yellow-600/80 border-yellow-700",
  silver: "bg-slate-400/80 border-slate-500"
};

// Dijkstra solver algorithm
function solveDijkstra(sources: string[], adj: Record<string, { target: string; weight: number }[]>) {
  const dist: Record<string, number> = {};
  const queue: { node: string; d: number }[] = [];

  Object.keys(adj).forEach(node => {
    dist[node] = Infinity;
  });

  sources.forEach(src => {
    if (dist[src] !== undefined) {
      dist[src] = 0;
      queue.push({ node: src, d: 0 });
    }
  });

  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const item = queue.shift();
    if (!item) continue;
    const { node, d } = item;

    if (d > dist[node]) continue;

    const neighbors = adj[node] || [];
    for (const edge of neighbors) {
      const newD = d + edge.weight;
      if (newD < dist[edge.target]) {
        dist[edge.target] = newD;
        queue.push({ node: edge.target, d: newD });
      }
    }
  }

  return dist;
}

// ----------------------------------------------------
// Main Component
// ----------------------------------------------------

export default function SimulatorPage() {
  // Workspace States
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [wires, setWires] = useState<WireConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [circuitLogs, setCircuitLogs] = useState<LogMessage[]>([]);
  const [timeTick, setTimeTick] = useState(0);

  // Audio mute controls
  const [isMuted, setIsMuted] = useState(false);

  // Wire drawing states
  const [wireStart, setWireStart] = useState<{ componentId: string; pinId: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Canvas movement states
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<SVGSVGElement>(null);

  // Simulated node potentials & parameters
  const [pinVoltages, setPinVoltages] = useState<Record<string, number>>({});
  const [shortCircuit, setShortCircuit] = useState(false);
  const [distToPosState, setDistToPosState] = useState<Record<string, number>>({});
  const [distToGndState, setDistToGndState] = useState<Record<string, number>>({});

  // Real-time oscilloscope values
  const [oscilloscopeHistory, setOscilloscopeHistory] = useState<number[]>([]);

  // Presets load/save states
  const [saveSlotName, setSaveSlotName] = useState("");
  const [customPresetsList, setCustomPresetsList] = useState<string[]>([]);

  // Web Audio Context Synthesizer Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<Record<string, { osc: OscillatorNode; gain: GainNode }>>({});

  // Local Custom Presets Listing
  useEffect(() => {
    if (typeof window !== "undefined") {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("electrobase_user_preset_"));
      setCustomPresetsList(keys.map(k => k.replace("electrobase_user_preset_", "")));
    }
  }, []);

  // 555 & Animation timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setTimeTick((prev) => prev + 1);
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const addLog = (text: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setCircuitLogs((prev) => [
      { id: Math.random().toString(), timestamp, text, type },
      ...prev.slice(0, 19)
    ]);
  };

  // Log on simulation toggle & manage audio contexts
  useEffect(() => {
    if (isSimulating) {
      addLog("Circuit Simulation Started.", "success");
      if (!audioCtxRef.current && typeof window !== "undefined") {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
    } else {
      addLog("Circuit Simulation Stopped.", "info");
      
      // Stop and clean up all audio oscillators
      Object.keys(oscillatorsRef.current).forEach((key) => {
        try {
          oscillatorsRef.current[key].osc.stop();
        } catch(e) {}
      });
      oscillatorsRef.current = {};
      
      // Reset components states
      setComponents((prev) =>
        prev.map((c) => ({
          ...c,
          state: {
            ...c.state,
            lit: false,
            outputHigh: false,
            voltageReadout: 0
          }
        }))
      );
      setPinVoltages({});
      setShortCircuit(false);
      setOscilloscopeHistory([]);
    }
  }, [isSimulating]);

  // ----------------------------------------------------
  // Dynamic Pin Canvas Coordinate Rotator
  // ----------------------------------------------------
  const getPinCanvasCoords = (compId: string, pinId: string) => {
    const comp = components.find((c) => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    const schema = PIN_SCHEMAS[comp.type] || [];
    const pin = schema.find((p) => p.pinId === pinId);
    if (!pin) return { x: 0, y: 0 };

    const { w, h } = getComponentSize(comp.type);
    const cx = w / 2;
    const cy = h / 2;

    const angle = comp.angle || 0;
    if (angle === 0) {
      return {
        x: comp.x + pin.x,
        y: comp.y + pin.y
      };
    }

    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const dx = pin.x - cx;
    const dy = pin.y - cy;

    const rdx = dx * cos - dy * sin;
    const rdy = dx * sin + dy * cos;

    return {
      x: Math.round(comp.x + cx + rdx),
      y: Math.round(comp.y + cy + rdy)
    };
  };

  // ----------------------------------------------------
  // Electrical Nodal & Dijkstra Solver
  // ----------------------------------------------------
  useEffect(() => {
    if (!isSimulating) {
      return;
    }

    // Pop sound generator helper
    const playPopSound = () => {
      if (audioCtxRef.current && !isMuted) {
        try {
          const ctx = audioCtxRef.current;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(150, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.16);
        } catch(e) {
          console.error("Failed playing pop sound:", e);
        }
      }
    };

    // Step 1: Initialize Union-Find structure to group connected pins into Net components (0-Ohm wire paths)
    const parent: Record<string, string> = {};
    const findRoot = (p: string): string => {
      let root = p;
      while (parent[root] !== root) {
        root = parent[root];
      }
      let curr = p;
      while (curr !== root) {
        let nxt = parent[curr];
        parent[curr] = root;
        curr = nxt;
      }
      return root;
    };
    
    const unionNets = (p1: string, p2: string) => {
      const r1 = findRoot(p1);
      const r2 = findRoot(p2);
      if (r1 !== r2) {
        parent[r1] = r2;
      }
    };

    const pinIds: string[] = [];
    components.forEach((c) => {
      const pins = PIN_SCHEMAS[c.type] || [];
      pins.forEach((p) => {
        const pinKey = `${c.id}_${p.pinId}`;
        pinIds.push(pinKey);
        parent[pinKey] = pinKey;
      });
    });

    // Union on wire connections
    wires.forEach((w) => {
      const p1 = `${w.from.componentId}_${w.from.pinId}`;
      const p2 = `${w.to.componentId}_${w.to.pinId}`;
      if (parent[p1] && parent[p2]) {
        unionNets(p1, p2);
      }
    });

    // Union on closed switches & active buttons
    components.forEach((c) => {
      if ((c.type === "switch" && c.state.toggled) || (c.type === "button" && c.state.pressed)) {
        const p1 = `${c.id}_p1`;
        const p2 = `${c.id}_p2`;
        if (parent[p1] && parent[p2]) {
          unionNets(p1, p2);
        }
      }
    });

    // Extract nets
    const pinToNet: Record<string, string> = {};
    const netSet = new Set<string>();
    pinIds.forEach((pin) => {
      const r = findRoot(pin);
      pinToNet[pin] = r;
      netSet.add(r);
    });
    const nets = Array.from(netSet);

    // Warm start voltages based on last frame
    const V: Record<string, number> = {};
    nets.forEach((net) => {
      let sum = 0;
      let count = 0;
      pinIds.forEach((pin) => {
        if (pinToNet[pin] === net && pinVoltages[pin] !== undefined) {
          sum += pinVoltages[pin];
          count++;
        }
      });
      V[net] = count > 0 ? sum / count : 0;
    });

    // Max source voltage in loop
    const maxV = components.filter(c => c.type === "battery").length > 0
      ? Math.max(...components.filter(c => c.type === "battery").map(b => b.value))
      : 9;

    // Step 2: Nodal Iterative Gauss-Seidel Solver (100 Relaxation Ticks)
    const iterations = 100;
    for (let it = 0; it < iterations; it++) {
      const num: Record<string, number> = {};
      const den: Record<string, number> = {};
      nets.forEach((n) => {
        num[n] = 0;
        den[n] = 0;
      });

      // Fixed Battery & Ground Sources
      components.forEach((c) => {
        if (c.type === "battery") {
          const posNet = pinToNet[`${c.id}_pos`];
          const negNet = pinToNet[`${c.id}_neg`];
          const batV = c.value || 9;
          
          if (posNet) {
            num[posNet] += 10.0 * batV; // low impedance driver
            den[posNet] += 10.0;
          }
          if (negNet) {
            num[negNet] += 10.0 * 0;
            den[negNet] += 10.0;
          }
        }
        if (c.type === "ground") {
          const gndNet = pinToNet[`${c.id}_gnd`];
          if (gndNet) {
            num[gndNet] += 10.0 * 0;
            den[gndNet] += 10.0;
          }
        }
      });

      // Logic Gate Drivers (HIGH output drives VCC, LOW drives 0V)
      components.forEach((c) => {
        if (c.type === "gateNot") {
          const inNet = pinToNet[`${c.id}_in`];
          const outNet = pinToNet[`${c.id}_out`];
          if (inNet && outNet) {
            const vIn = V[inNet] || 0;
            const outputHigh = vIn < (maxV * 0.45);
            const targetV = outputHigh ? maxV : 0;
            num[outNet] += 0.1 * targetV; // driver impedance
            den[outNet] += 0.1;
          }
        }
        if (c.type === "gateAnd" || c.type === "gateOr") {
          const in1Net = pinToNet[`${c.id}_in1`];
          const in2Net = pinToNet[`${c.id}_in2`];
          const outNet = pinToNet[`${c.id}_out`];
          if (in1Net && in2Net && outNet) {
            const vIn1 = V[in1Net] || 0;
            const vIn2 = V[in2Net] || 0;
            const in1High = vIn1 > (maxV * 0.45);
            const in2High = vIn2 > (maxV * 0.45);
            const outputHigh = c.type === "gateAnd" ? (in1High && in2High) : (in1High || in2High);
            const targetV = outputHigh ? maxV : 0;
            num[outNet] += 0.1 * targetV;
            den[outNet] += 0.1;
          }
        }
        if (c.type === "timer555") {
          const vccNet = pinToNet[`${c.id}_VCC`];
          const gndNet = pinToNet[`${c.id}_GND`];
          const trigNet = pinToNet[`${c.id}_TRIG`];
          const resetNet = pinToNet[`${c.id}_RESET`];
          const outNet = pinToNet[`${c.id}_OUT`];
          
          if (vccNet && gndNet && outNet) {
            const vVcc = V[vccNet] || 0;
            const vGnd = V[gndNet] || 0;
            const vReset = resetNet ? (V[resetNet] || 0) : vVcc;
            const isPowered = (vVcc - vGnd) > 2.0;
            
            if (isPowered) {
              if (vReset < 0.8) {
                num[outNet] += 0.1 * vGnd;
                den[outNet] += 0.1;
              } else if (trigNet) {
                const vTrig = V[trigNet] || 0;
                const vThLow = vGnd + (vVcc - vGnd) / 3;
                const vThHigh = vGnd + 2 * (vVcc - vGnd) / 3;
                let stateHigh = c.state.outputHigh || false;
                if (vTrig < vThLow) stateHigh = true;
                else if (vTrig > vThHigh) stateHigh = false;
                c.state.outputHigh = stateHigh;
                num[outNet] += 0.1 * (stateHigh ? vVcc : vGnd);
                den[outNet] += 0.1;
              } else {
                const stateHigh = Math.floor(timeTick / 3) % 2 === 0;
                c.state.outputHigh = stateHigh;
                num[outNet] += 0.1 * (stateHigh ? vVcc : vGnd);
                den[outNet] += 0.1;
              }
            } else {
              num[outNet] += 0.1 * vGnd;
              den[outNet] += 0.1;
            }
          }
        }
      });

      // Passive Component Interconnects
      components.forEach((c) => {
        if (c.type === "resistor") {
          const n1 = pinToNet[`${c.id}_p1`];
          const n2 = pinToNet[`${c.id}_p2`];
          if (n1 && n2) {
            const g = 1 / Math.max(1, c.value);
            num[n1] += g * V[n2];
            den[n1] += g;
            num[n2] += g * V[n1];
            den[n2] += g;
          }
        }
        if (c.type === "ldr") {
          const n1 = pinToNet[`${c.id}_p1`];
          const n2 = pinToNet[`${c.id}_p2`];
          if (n1 && n2) {
            const light = c.value !== undefined ? c.value : 50;
            const r = Math.max(10, 100 + (10000 - 100) * (1 - light / 100));
            const g = 1 / r;
            num[n1] += g * V[n2];
            den[n1] += g;
            num[n2] += g * V[n1];
            den[n2] += g;
          }
        }
        if (c.type === "capacitor") {
          const n1 = pinToNet[`${c.id}_p1`];
          const n2 = pinToNet[`${c.id}_p2`];
          if (n1 && n2) {
            const capVal = c.value || 100;
            const rEq = Math.max(5, 0.08 / (capVal * 1e-6));
            const g = 1 / rEq;
            const vCap = c.state.capacitorVoltage || 0;
            const iEq = vCap * g;
            
            num[n1] += g * V[n2] - iEq;
            den[n1] += g;
            num[n2] += g * V[n1] + iEq;
            den[n2] += g;
          }
        }
        if (c.type === "potentiometer") {
          const n1 = pinToNet[`${c.id}_p1`];
          const n2 = pinToNet[`${c.id}_p2`];
          const nw = pinToNet[`${c.id}_wiper`];
          if (n1 && n2 && nw) {
            const pct = c.value || 50;
            const rL = Math.max(1, 10000 * (pct / 100));
            const rR = Math.max(1, 10000 * (1 - pct / 100));
            const gL = 1 / rL;
            const gR = 1 / rR;
            
            num[n1] += gL * V[nw];
            den[n1] += gL;
            num[nw] += gL * V[n1];
            den[nw] += gL;
            
            num[n2] += gR * V[nw];
            den[n2] += gR;
            num[nw] += gR * V[n2];
            den[nw] += gR;
          }
        }
        if (c.type === "led" && !c.state.blown) {
          const nA = pinToNet[`${c.id}_anode`];
          const nC = pinToNet[`${c.id}_cathode`];
          if (nA && nC) {
            const diff = (V[nA] || 0) - (V[nC] || 0);
            if (diff > 1.8) {
              const g = 1 / 15;
              num[nA] += g * V[nC];
              den[nA] += g;
              num[nC] += g * V[nA];
              den[nC] += g;
            }
          }
        }
        if (c.type === "transistor") {
          const nColl = pinToNet[`${c.id}_collector`];
          const nBase = pinToNet[`${c.id}_base`];
          const nEmit = pinToNet[`${c.id}_emitter`];
          if (nColl && nBase && nEmit) {
            const vB = V[nBase] || 0;
            const vE = V[nEmit] || 0;
            const vC = V[nColl] || 0;
            if ((vB - vE) > 0.7 && vC > vE) {
              const g = 1 / 10;
              num[nColl] += g * V[nEmit];
              den[nColl] += g;
              num[nEmit] += g * V[nColl];
              den[nEmit] += g;
            }
          }
        }
        if (c.type === "buzzer") {
          const n1 = pinToNet[`${c.id}_pos`];
          const n2 = pinToNet[`${c.id}_neg`];
          if (n1 && n2) {
            const g = 1 / 100;
            num[n1] += g * V[n2];
            den[n1] += g;
            num[n2] += g * V[n1];
            den[n2] += g;
          }
        }
        if (c.type === "voltmeter") {
          const n1 = pinToNet[`${c.id}_pos`];
          const n2 = pinToNet[`${c.id}_neg`];
          if (n1 && n2) {
            const g = 1 / 1000000;
            num[n1] += g * V[n2];
            den[n1] += g;
            num[n2] += g * V[n1];
            den[n2] += g;
          }
        }
      });

      // Relaxation update
      nets.forEach((n) => {
        if (den[n] > 0) {
          V[n] = V[n] * 0.3 + (num[n] / den[n]) * 0.7;
        }
      });
    }

    // Step 3: Record Pin Voltages & Capacitor State
    const calculatedVoltages: Record<string, number> = {};
    pinIds.forEach((pin) => {
      const net = pinToNet[pin];
      calculatedVoltages[pin] = parseFloat((V[net] || 0).toFixed(2));
    });
    setPinVoltages(calculatedVoltages);

    components.forEach((c) => {
      if (c.type === "capacitor") {
        const n1 = pinToNet[`${c.id}_p1`];
        const n2 = pinToNet[`${c.id}_p2`];
        if (n1 && n2) {
          c.state.capacitorVoltage = parseFloat(((V[n1] || 0) - (V[n2] || 0)).toFixed(2));
        }
      }
    });

    // Step 4: Detect direct battery short circuits
    let isShort = false;
    components.forEach((c) => {
      if (c.type === "battery") {
        const posNet = pinToNet[`${c.id}_pos`];
        const negNet = pinToNet[`${c.id}_neg`];
        if (posNet && negNet && posNet === negNet) {
          isShort = true;
        }
      }
    });
    setShortCircuit(isShort);

    // Step 5: Construct Adjacency Graph for Dijkstra path calculations
    const adj: Record<string, { target: string; weight: number }[]> = {};
    pinIds.forEach(p => {
      adj[p] = [];
    });

    wires.forEach((w) => {
      const p1 = `${w.from.componentId}_${w.from.pinId}`;
      const p2 = `${w.to.componentId}_${w.to.pinId}`;
      if (adj[p1] && adj[p2]) {
        adj[p1].push({ target: p2, weight: 0.1 });
        adj[p2].push({ target: p1, weight: 0.1 });
      }
    });

    components.forEach((c) => {
      if ((c.type === "switch" && c.state.toggled) || (c.type === "button" && c.state.pressed)) {
        const p1 = `${c.id}_p1`;
        const p2 = `${c.id}_p2`;
        if (adj[p1] && adj[p2]) {
          adj[p1].push({ target: p2, weight: 0.1 });
          adj[p2].push({ target: p1, weight: 0.1 });
        }
      }
    });

    components.forEach((c) => {
      if (c.type === "resistor") {
        const p1 = `${c.id}_p1`;
        const p2 = `${c.id}_p2`;
        if (adj[p1] && adj[p2]) {
          adj[p1].push({ target: p2, weight: c.value });
          adj[p2].push({ target: p1, weight: c.value });
        }
      }
    });

    components.forEach((c) => {
      if (c.type === "ldr") {
        const p1 = `${c.id}_p1`;
        const p2 = `${c.id}_p2`;
        if (adj[p1] && adj[p2]) {
          const l = c.value !== undefined ? c.value : 50;
          const r = Math.max(10, 100 + (10000 - 100) * (1 - l / 100));
          adj[p1].push({ target: p2, weight: r });
          adj[p2].push({ target: p1, weight: r });
        }
      }
    });

    components.forEach((c) => {
      if (c.type === "capacitor") {
        const p1 = `${c.id}_p1`;
        const p2 = `${c.id}_p2`;
        if (adj[p1] && adj[p2]) {
          const capVal = c.value || 100;
          const rEq = Math.max(5, 0.08 / (capVal * 1e-6));
          adj[p1].push({ target: p2, weight: rEq });
          adj[p2].push({ target: p1, weight: rEq });
        }
      }
    });

    components.forEach((c) => {
      if (c.type === "potentiometer") {
        const p1 = `${c.id}_p1`;
        const p2 = `${c.id}_p2`;
        const wiper = `${c.id}_wiper`;
        if (adj[p1] && adj[wiper] && adj[p2]) {
          const val = c.value || 50;
          const rLeft = Math.max(1, 10000 * (val / 100));
          const rRight = Math.max(1, 10000 * (1 - val / 100));
          adj[p1].push({ target: wiper, weight: rLeft });
          adj[wiper].push({ target: p1, weight: rLeft });
          adj[p2].push({ target: wiper, weight: rRight });
          adj[wiper].push({ target: p2, weight: rRight });
        }
      }
    });

    components.forEach((c) => {
      if (c.type === "led" && !c.state.blown) {
        const anode = `${c.id}_anode`;
        const cathode = `${c.id}_cathode`;
        if (adj[anode] && adj[cathode]) {
          adj[anode].push({ target: cathode, weight: 15 });
        }
      }
    });

    components.forEach((c) => {
      if (c.type === "transistor") {
        const col = `${c.id}_collector`;
        const b = `${c.id}_base`;
        const e = `${c.id}_emitter`;
        if (adj[b] && adj[e]) {
          adj[b].push({ target: e, weight: 100 });
        }
        const vB = calculatedVoltages[b] || 0;
        const vE = calculatedVoltages[e] || 0;
        if ((vB - vE) > 0.7 && adj[col] && adj[e]) {
          adj[col].push({ target: e, weight: 10 });
          adj[e].push({ target: col, weight: 10 });
        }
      }
    });

    components.forEach((c) => {
      if (c.type === "buzzer") {
        const pos = `${c.id}_pos`;
        const neg = `${c.id}_neg`;
        if (adj[pos] && adj[neg]) {
          adj[pos].push({ target: neg, weight: 100 });
          adj[neg].push({ target: pos, weight: 100 });
        }
      }
    });

    components.forEach((c) => {
      if (c.type === "voltmeter") {
        const pos = `${c.id}_pos`;
        const neg = `${c.id}_neg`;
        if (adj[pos] && adj[neg]) {
          adj[pos].push({ target: neg, weight: 1000000 });
          adj[neg].push({ target: pos, weight: 1000000 });
        }
      }
    });

    // Run Dijkstra
    const batteryPosSources: string[] = [];
    const batteryNegSources: string[] = [];
    const batteryGndSources: string[] = [];
    components.forEach((c) => {
      if (c.type === "battery") {
        batteryPosSources.push(`${c.id}_pos`);
        batteryNegSources.push(`${c.id}_neg`);
      }
      if (c.type === "ground") {
        batteryGndSources.push(`${c.id}_gnd`);
      }
    });

    const distToPos = solveDijkstra(batteryPosSources, adj);
    const distToGnd = solveDijkstra([...batteryNegSources, ...batteryGndSources], adj);
    setDistToPosState(distToPos);
    setDistToGndState(distToGnd);

    // Step 6: Evaluate Active States, Blowouts & Buzzers
    let ledOverload = false;
    const activeBuzzers = new Set<string>();

    setComponents((prev) =>
      prev.map((c) => {
        if (c.type === "led") {
          if (c.state.blown) return c;
          const anodePin = `${c.id}_anode`;
          const cathodePin = `${c.id}_cathode`;
          const vAnode = calculatedVoltages[anodePin] || 0;
          const vCathode = calculatedVoltages[cathodePin] || 0;
          const rTop = distToPos[anodePin] || Infinity;
          const rBottom = distToGnd[cathodePin] || Infinity;
          const rLoop = rTop + rBottom;
          
          const deltaV = vAnode - vCathode;
          const lit = deltaV > 1.8 && !isShort;
          let blown = false;

          // LED blows if connected directly to source without protective resistor under >3V
          if (lit && rLoop < 20 && maxV > 3.0) {
            blown = true;
            ledOverload = true;
            playPopSound();
            addLog(`💥 LED [${c.label}] popped due to overload!`, "error");
          }

          return { ...c, state: { ...c.state, lit, blown: blown || c.state.blown } };
        }

        if (c.type === "voltmeter") {
          const vPos = calculatedVoltages[`${c.id}_pos`] || 0;
          const vNeg = calculatedVoltages[`${c.id}_neg`] || 0;
          const diff = Math.abs(vPos - vNeg);
          return { ...c, state: { ...c.state, voltageReadout: diff } };
        }

        if (c.type === "buzzer") {
          const vPos = calculatedVoltages[`${c.id}_pos`] || 0;
          const vNeg = calculatedVoltages[`${c.id}_neg`] || 0;
          const deltaV = vPos - vNeg;
          const powered = deltaV > 2.0 && !isShort;
          if (powered) activeBuzzers.add(c.id);
          return c;
        }

        return c;
      })
    );

    if (isShort) {
      addLog("⚠️ SHORT CIRCUIT DETECTED! Shutting currents off.", "error");
    }
    if (ledOverload) {
      addLog("💥 LED OVERLOAD! Protect with a series resistor.", "error");
    }

    // Audio buzzers
    if (audioCtxRef.current && !isMuted) {
      components.forEach((c) => {
        if (c.type !== "buzzer") return;
        const isPowered = activeBuzzers.has(c.id);
        const oscEntry = oscillatorsRef.current[c.id];
        if (isPowered) {
          if (!oscEntry) {
            try {
              const ctx = audioCtxRef.current!;
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.value = c.value || 1000;
              gain.gain.value = 0.03;
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              oscillatorsRef.current[c.id] = { osc, gain };
              addLog(`🔊 Buzzer tone sounding at ${c.value || 1000}Hz.`, "info");
            } catch(e) {}
          } else {
            oscEntry.osc.frequency.setValueAtTime(c.value || 1000, audioCtxRef.current!.currentTime);
            oscEntry.gain.gain.setValueAtTime(0.03, audioCtxRef.current!.currentTime);
          }
        } else {
          if (oscEntry) {
            oscEntry.gain.gain.setValueAtTime(0, audioCtxRef.current!.currentTime);
          }
        }
      });
    }

  }, [isSimulating, wires, components, timeTick, isMuted]);

  // ----------------------------------------------------
  // Real-time Oscilloscope Data Fetcher
  // ----------------------------------------------------
  useEffect(() => {
    if (!isSimulating || !selectedId) {
      setOscilloscopeHistory([]);
      return;
    }

    const selectedComp = components.find(c => c.id === selectedId);
    if (!selectedComp) return;

    const schema = PIN_SCHEMAS[selectedComp.type] || [];
    if (schema.length === 0) return;

    const outPin = schema.find(p => p.pinId === "OUT" || p.pinId === "out" || p.pinId === "wiper" || p.pinId === "pos");
    const pinId = outPin ? outPin.pinId : schema[0].pinId;
    const pinName = `${selectedComp.id}_${pinId}`;
    const voltVal = pinVoltages[pinName] || 0;

    setOscilloscopeHistory((prev) => [...prev, voltVal].slice(-50));

  }, [timeTick, selectedId, isSimulating, pinVoltages]);

  // ----------------------------------------------------
  // Component Actions & Helpers
  // ----------------------------------------------------

  const spawnComponent = (type: ComponentType, label: string, value = 0, color = "red") => {
    const newComp: ComponentInstance = {
      id: `${type}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: 320 + (components.length * 15) % 100,
      y: 200 + (components.length * 15) % 100,
      label,
      value: type === "potentiometer" ? 50 : type === "ldr" ? 50 : type === "buzzer" ? 1000 : value,
      angle: 0,
      state: {
        toggled: false,
        pressed: false,
        blown: false,
        lit: false,
        outputHigh: false,
        voltageReadout: 0
      },
      color: type === "led" ? color : undefined
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedId(newComp.id);
    addLog(`Spawned ${label} in workspace.`, "info");
  };

  const deleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setWires((prev) => prev.filter((w) => w.from.componentId !== id && w.to.componentId !== id));
    
    if (oscillatorsRef.current[id]) {
      try {
        oscillatorsRef.current[id].osc.stop();
      } catch(e) {}
      delete oscillatorsRef.current[id];
    }

    if (selectedId === id) setSelectedId(null);
    if (wireStart?.componentId === id) setWireStart(null);
    addLog("Deleted component from workspace.", "info");
  };

  const clearWorkspace = () => {
    setIsSimulating(false);
    setComponents([]);
    setWires([]);
    setSelectedId(null);
    setWireStart(null);
    addLog("Workspace cleared.", "info");
  };

  const rotateSelectedComponent = () => {
    if (!selectedId) return;
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== selectedId) return c;
        const nextAngle = ((c.angle || 0) + 90) % 360;
        addLog(`Rotated [${c.label}] to ${nextAngle}°.`, "info");
        return { ...c, angle: nextAngle };
      })
    );
  };

  // Canvas snapping & movement dragging
  const snap = (coord: number) => Math.round(coord / 20) * 20;

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (draggingCompId) {
      setComponents((prev) =>
        prev.map((c) => {
          if (c.id !== draggingCompId) return c;
          return {
            ...c,
            x: snap(x - dragOffset.x),
            y: snap(y - dragOffset.y)
          };
        })
      );
    }
  };

  const handleComponentStartDrag = (id: string, e: React.MouseEvent, componentX: number, componentY: number) => {
    e.stopPropagation();
    setSelectedId(id);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setDraggingCompId(id);
    setDragOffset({
      x: mouseX - componentX,
      y: mouseY - componentY
    });
  };

  const handleCanvasMouseUp = () => setDraggingCompId(null);

  const handlePinClick = (e: React.MouseEvent, componentId: string, pinId: string) => {
    e.stopPropagation();
    if (!wireStart) {
      setWireStart({ componentId, pinId });
      addLog(`Connecting wire from ${componentId} pin [${pinId}]...`, "info");
    } else {
      if (wireStart.componentId === componentId) {
        setWireStart(null);
        addLog("Cannot connect pins on same component.", "warning");
        return;
      }

      const wireExists = wires.some(
        (w) =>
          (w.from.componentId === wireStart.componentId && w.from.pinId === wireStart.pinId && w.to.componentId === componentId && w.to.pinId === pinId) ||
          (w.from.componentId === componentId && w.from.pinId === pinId && w.to.componentId === wireStart.componentId && w.to.pinId === wireStart.pinId)
      );

      if (wireExists) {
        setWireStart(null);
        addLog("Wire connection already exists.", "warning");
        return;
      }

      const newWire: WireConnection = {
        id: `wire_${Math.random().toString(36).substr(2, 9)}`,
        from: { componentId: wireStart.componentId, pinId: wireStart.pinId },
        to: { componentId, pinId }
      };

      setWires((prev) => [...prev, newWire]);
      setWireStart(null);
      addLog("Wire connected.", "success");
    }
  };

  const deleteWire = (id: string) => {
    setWires((prev) => prev.filter((w) => w.id !== id));
    addLog("Deleted wire connection.", "info");
  };

  const handleCanvasClick = () => {
    if (wireStart) {
      setWireStart(null);
      addLog("Wire drawing cancelled.", "info");
    }
    setSelectedId(null);
  };

  // Toggle switch states directly on grid click
  const handleComponentInteraction = (e: React.MouseEvent, comp: ComponentInstance) => {
    e.stopPropagation();
    if (comp.type === "switch") {
      setComponents((prev) =>
        prev.map((c) => {
          if (c.id !== comp.id) return c;
          const nextState = !c.state.toggled;
          addLog(`Switch [${c.label}] toggled ${nextState ? "ON" : "OFF"}.`, "info");
          return { ...c, state: { ...c.state, toggled: nextState } };
        })
      );
    }
  };

  const handleButtonPress = (comp: ComponentInstance, pressed: boolean) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== comp.id) return c;
        return { ...c, state: { ...c.state, pressed } };
      })
    );
  };

  // Selected item values overrides
  const updateSelectedValue = (value: number) => {
    if (!selectedId) return;
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== selectedId) return c;
        return { ...c, value };
      })
    );
  };

  const updateSelectedColor = (color: string) => {
    if (!selectedId) return;
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== selectedId) return c;
        return { ...c, color };
      })
    );
  };

  const resetLEDs = () => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.type !== "led") return c;
        return {
          ...c,
          state: { ...c.state, blown: false, lit: false }
        };
      })
    );
    addLog("Repaired all blown LEDs.", "success");
  };

  // ----------------------------------------------------
  // Custom Presets Saving & Loading (localStorage)
  // ----------------------------------------------------
  const handleSavePreset = () => {
    if (!saveSlotName.trim()) {
      addLog("Enter a name to save preset.", "warning");
      return;
    }
    const data = JSON.stringify({ components, wires });
    localStorage.setItem(`electrobase_user_preset_${saveSlotName.trim()}`, data);
    addLog(`Preset "${saveSlotName.trim()}" saved.`, "success");
    
    // Refresh presets list
    const keys = Object.keys(localStorage).filter(k => k.startsWith("electrobase_user_preset_"));
    setCustomPresetsList(keys.map(k => k.replace("electrobase_user_preset_", "")));
    setSaveSlotName("");
  };

  const handleLoadPreset = (name: string) => {
    const rawData = localStorage.getItem(`electrobase_user_preset_${name}`);
    if (!rawData) return;
    try {
      setIsSimulating(false);
      setSelectedId(null);
      setWireStart(null);
      const parsed = JSON.parse(rawData);
      setComponents(parsed.components || []);
      setWires(parsed.wires || []);
      addLog(`Loaded preset "${name}".`, "success");
    } catch(e) {
      addLog("Failed to parse preset.", "error");
    }
  };

  const loadBuiltInTemplate = (templateName: "simpleLed" | "logicAnd" | "blinker555" | "darknessLdr") => {
    setIsSimulating(false);
    setSelectedId(null);
    setWireStart(null);

    if (templateName === "simpleLed") {
      const batId = "bat_1";
      const swId = "sw_1";
      const resId = "res_1";
      const ledId = "led_1";

      setComponents([
        { id: batId, type: "battery", x: 100, y: 160, label: "9V Battery", value: 9, angle: 0, state: {} },
        { id: swId, type: "switch", x: 260, y: 120, label: "Power Switch", value: 0, angle: 0, state: { toggled: true } },
        { id: resId, type: "resistor", x: 420, y: 140, label: "330 Ohm Resistor", value: 330, angle: 0, state: {} },
        { id: ledId, type: "led", x: 580, y: 190, label: "Red LED", value: 0, angle: 0, state: {}, color: "red" },
        { id: "gnd_1", type: "ground", x: 260, y: 340, label: "Circuit GND", value: 0, angle: 0, state: {} }
      ]);

      setWires([
        { id: "w1", from: { componentId: batId, pinId: "pos" }, to: { componentId: swId, pinId: "p1" } },
        { id: "w2", from: { componentId: swId, pinId: "p2" }, to: { componentId: resId, pinId: "p1" } },
        { id: "w3", from: { componentId: resId, pinId: "p2" }, to: { componentId: ledId, pinId: "anode" } },
        { id: "w4", from: { componentId: ledId, pinId: "cathode" }, to: { componentId: "gnd_1", pinId: "gnd" } },
        { id: "w5", from: { componentId: batId, pinId: "neg" }, to: { componentId: "gnd_1", pinId: "gnd" } }
      ]);

      addLog("Loaded LED loop template.", "success");
    } else if (templateName === "logicAnd") {
      const batId = "bat_1";
      const sw1Id = "sw_1";
      const sw2Id = "sw_2";
      const andId = "and_1";
      const ledId = "led_1";

      setComponents([
        { id: batId, type: "battery", x: 80, y: 180, label: "5V Source", value: 5, angle: 0, state: {} },
        { id: sw1Id, type: "switch", x: 240, y: 100, label: "Input A", value: 0, angle: 0, state: { toggled: true } },
        { id: sw2Id, type: "switch", x: 240, y: 220, label: "Input B", value: 0, angle: 0, state: { toggled: false } },
        { id: andId, type: "gateAnd", x: 420, y: 160, label: "AND Gate", value: 0, angle: 0, state: {} },
        { id: ledId, type: "led", x: 600, y: 200, label: "Output LED", value: 0, angle: 0, state: {}, color: "green" },
        { id: "gnd_1", type: "ground", x: 420, y: 340, label: "GND", value: 0, angle: 0, state: {} }
      ]);

      setWires([
        { id: "w1", from: { componentId: batId, pinId: "pos" }, to: { componentId: sw1Id, pinId: "p1" } },
        { id: "w2", from: { componentId: batId, pinId: "pos" }, to: { componentId: sw2Id, pinId: "p1" } },
        { id: "w3", from: { componentId: sw1Id, pinId: "p2" }, to: { componentId: andId, pinId: "in1" } },
        { id: "w4", from: { componentId: sw2Id, pinId: "p2" }, to: { componentId: andId, pinId: "in2" } },
        { id: "w5", from: { componentId: andId, pinId: "out" }, to: { componentId: ledId, pinId: "anode" } },
        { id: "w6", from: { componentId: ledId, pinId: "cathode" }, to: { componentId: "gnd_1", pinId: "gnd" } },
        { id: "w7", from: { componentId: batId, pinId: "neg" }, to: { componentId: "gnd_1", pinId: "gnd" } }
      ]);

      addLog("Loaded Logic AND Gate template.", "success");
    } else if (templateName === "blinker555") {
      const batId = "bat_1";
      const timerId = "555_1";
      const bzId = "bz_1";
      const ledId = "led_1";

      setComponents([
        { id: batId, type: "battery", x: 80, y: 200, label: "9V Supply", value: 9, angle: 0, state: {} },
        { id: timerId, type: "timer555", x: 280, y: 160, label: "NE555 Timer", value: 0, angle: 0, state: {} },
        { id: ledId, type: "led", x: 500, y: 160, label: "Blink LED", value: 0, angle: 0, state: {}, color: "yellow" },
        { id: bzId, type: "buzzer", x: 500, y: 260, label: "Beep Buzzer", value: 1200, angle: 0, state: {} },
        { id: "gnd_1", type: "ground", x: 300, y: 380, label: "GND", value: 0, angle: 0, state: {} }
      ]);

      setWires([
        { id: "w1", from: { componentId: batId, pinId: "pos" }, to: { componentId: timerId, pinId: "VCC" } },
        { id: "w2", from: { componentId: timerId, pinId: "VCC" }, to: { componentId: timerId, pinId: "RESET" } },
        { id: "w3", from: { componentId: timerId, pinId: "GND" }, to: { componentId: "gnd_1", pinId: "gnd" } },
        { id: "w4", from: { componentId: batId, pinId: "neg" }, to: { componentId: "gnd_1", pinId: "gnd" } },
        { id: "w5", from: { componentId: timerId, pinId: "OUT" }, to: { componentId: ledId, pinId: "anode" } },
        { id: "w6", from: { componentId: timerId, pinId: "OUT" }, to: { componentId: bzId, pinId: "pos" } },
        { id: "w7", from: { componentId: ledId, pinId: "cathode" }, to: { componentId: "gnd_1", pinId: "gnd" } },
        { id: "w8", from: { componentId: bzId, pinId: "neg" }, to: { componentId: "gnd_1", pinId: "gnd" } }
      ]);

      addLog("Loaded 555 Blinker & Buzzer template.", "success");
    } else if (templateName === "darknessLdr") {
      const batId = "bat_1";
      const resSensorId = "res_1";
      const ldrId = "ldr_1";
      const transId = "q_1";
      const ledId = "led_1";
      const resLedId = "res_2";
      const gndId = "gnd_1";

      setComponents([
        { id: batId, type: "battery", x: 80, y: 160, label: "9V Battery", value: 9, angle: 0, state: {} },
        { id: resSensorId, type: "resistor", x: 240, y: 120, label: "10K pull-up", value: 10000, angle: 0, state: {} },
        { id: ldrId, type: "ldr", x: 240, y: 220, label: "LDR Sensor", value: 10, angle: 0, state: {} },
        { id: transId, type: "transistor", x: 400, y: 180, label: "BC547 NPN", value: 0, angle: 0, state: {} },
        { id: resLedId, type: "resistor", x: 400, y: 60, label: "330 Ohm limit", value: 330, angle: 0, state: {} },
        { id: ledId, type: "led", x: 540, y: 120, label: "Night LED", value: 0, angle: 0, state: {}, color: "yellow" },
        { id: gndId, type: "ground", x: 400, y: 320, label: "GND", value: 0, angle: 0, state: {} }
      ]);

      setWires([
        { id: "w1", from: { componentId: batId, pinId: "pos" }, to: { componentId: resSensorId, pinId: "p1" } },
        { id: "w2", from: { componentId: batId, pinId: "pos" }, to: { componentId: resLedId, pinId: "p1" } },
        { id: "w3", from: { componentId: resSensorId, pinId: "p2" }, to: { componentId: ldrId, pinId: "p1" } },
        { id: "w4", from: { componentId: resSensorId, pinId: "p2" }, to: { componentId: transId, pinId: "base" } },
        { id: "w5", from: { componentId: ldrId, pinId: "p2" }, to: { componentId: gndId, pinId: "gnd" } },
        { id: "w6", from: { componentId: transId, pinId: "emitter" }, to: { componentId: gndId, pinId: "gnd" } },
        { id: "w7", from: { componentId: batId, pinId: "neg" }, to: { componentId: gndId, pinId: "gnd" } },
        { id: "w8", from: { componentId: resLedId, pinId: "p2" }, to: { componentId: ledId, pinId: "anode" } },
        { id: "w9", from: { componentId: ledId, pinId: "cathode" }, to: { componentId: transId, pinId: "collector" } }
      ]);

      addLog("Loaded LDR Darkness Detector template.", "success");
    }
  };

  const selectedComp = components.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* Visual wire speed and pin pulses */}
      <style>{`
        @keyframes flowAnim {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .animate-flow-dash {
          animation: flowAnim 0.6s linear infinite;
        }
        @keyframes pinGlow {
          0% { opacity: 0.3; stroke-width: 1.5px; }
          50% { opacity: 0.9; stroke-width: 3.5px; }
          100% { opacity: 0.3; stroke-width: 1.5px; }
        }
        .animate-pin-glow {
          animation: pinGlow 1.4s ease-in-out infinite;
        }
      `}</style>

      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400">
            <Zap size={12} />
            <span>SANDBOX WORKSPACE PRO</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Interactive Circuit Space</h1>
          <p className="text-muted-foreground text-sm">
            Interactive breadboarding playground. Draw wires between pins, rotate components, slider control potentiometers/batteries, and view live signals in the oscilloscope.
          </p>
        </div>
        
        {/* Play/Pause controls */}
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg border border-border bg-card/40 hover:bg-neutral-800 text-muted-foreground hover:text-foreground transition-all"
            title={isMuted ? "Unmute buzzers" : "Mute buzzers"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="text-cyan-400" />}
          </button>
          
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isSimulating
                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                : "bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20"
            }`}
          >
            {isSimulating ? (
              <>
                <Square size={16} fill="currentColor" />
                <span>Stop Simulation</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" className="animate-pulse" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
          <button
            onClick={clearWorkspace}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={14} />
            <span>Clear Grid</span>
          </button>
        </div>
      </div>

      {/* Presets Saving & Loading */}
      <div className="rounded-xl glass border border-border/40 p-4 grid gap-4 lg:grid-cols-12 items-center">
        {/* Templates loader */}
        <div className="lg:col-span-6 flex flex-wrap items-center gap-3">
          <div className="text-xs font-mono text-cyan-400 flex items-center gap-2 uppercase">
            <Cpu size={14} />
            <span>Templates:</span>
          </div>
          <button
            onClick={() => loadBuiltInTemplate("simpleLed")}
            className="px-2.5 py-1 rounded bg-neutral-900 border border-border/60 text-xs hover:border-cyan-500/40 text-foreground transition-colors"
          >
            💡 LED Loop
          </button>
          <button
            onClick={() => loadBuiltInTemplate("logicAnd")}
            className="px-2.5 py-1 rounded bg-neutral-900 border border-border/60 text-xs hover:border-cyan-500/40 text-foreground transition-colors"
          >
            🔀 Logic AND
          </button>
          <button
            onClick={() => loadBuiltInTemplate("blinker555")}
            className="px-2.5 py-1 rounded bg-neutral-900 border border-border/60 text-xs hover:border-cyan-500/40 text-foreground transition-colors"
          >
            ⏱️ 555 Blinker
          </button>
          <button
            onClick={() => loadBuiltInTemplate("darknessLdr")}
            className="px-2.5 py-1 rounded bg-neutral-900 border border-border/60 text-xs hover:border-cyan-500/40 text-foreground transition-colors"
          >
            🌙 LDR Night Light
          </button>
          <button
            onClick={resetLEDs}
            className="px-2 py-1 rounded border border-red-500/20 bg-red-950/20 text-xs text-red-400 hover:bg-red-950/40 transition-colors"
          >
            🔧 Fix LEDs
          </button>
        </div>

        {/* Custom Presets saving */}
        <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-border/40 pt-3 lg:pt-0 lg:pl-4 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2 flex-grow">
            <Save size={14} className="text-cyan-400" />
            <input
              type="text"
              placeholder="Preset Name..."
              value={saveSlotName}
              onChange={(e) => setSaveSlotName(e.target.value)}
              className="px-2 py-1 rounded bg-neutral-900 border border-border/60 text-xs text-foreground focus:outline-none focus:border-cyan-500 max-w-[140px]"
            />
            <button
              onClick={handleSavePreset}
              className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-semibold transition-colors"
            >
              Save Custom
            </button>
          </div>
          
          {customPresetsList.length > 0 && (
            <div className="flex items-center gap-2">
              <FolderOpen size={14} className="text-cyan-400" />
              <select
                onChange={(e) => {
                  if (e.target.value) handleLoadPreset(e.target.value);
                  e.target.value = "";
                }}
                className="px-2 py-1 rounded bg-neutral-900 border border-border/60 text-xs text-foreground focus:outline-none"
              >
                <option value="">Load Preset...</option>
                {customPresetsList.map((name) => (
                  <option key={name} value={name}>
                    📂 {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Toolbox */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl glass border border-border/40 p-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Components Toolbox
            </h3>
            
            <div className="grid grid-cols-1 gap-2 text-left h-[440px] overflow-y-auto pr-1">
              {[
                { type: "battery", label: "Battery DC", desc: "Source voltage", val: 9, icon: "🔋" },
                { type: "resistor", label: "Resistor", desc: "Limits current loop", val: 330, icon: "▱" },
                { type: "capacitor", label: "Capacitor", desc: "Charges electricity", val: 100, icon: "┫┣" },
                { type: "potentiometer", label: "Potentiometer", desc: "Variable wiper resistor", val: 50, icon: "◵" },
                { type: "led", label: "LED Bulb", desc: "Glows under current", val: 0, icon: "💡" },
                { type: "buzzer", label: "Piezo Buzzer", desc: "Emits sound tone", val: 1000, icon: "🔊" },
                { type: "switch", label: "Toggle Switch", desc: "SPST toggle contact", val: 0, icon: "⌿" },
                { type: "button", label: "Push Button", desc: "Active when clicked", val: 0, icon: "⏊" },
                { type: "timer555", label: "NE555 Timer", desc: "Astable oscillator", val: 0, icon: "🔲" },
                { type: "gateNot", label: "Logic NOT", desc: "Signal inverter", val: 0, icon: "▷o" },
                { type: "gateAnd", label: "Logic AND", desc: "Output logic AND", val: 0, icon: "D-" },
                { type: "gateOr", label: "Logic OR", desc: "Output logic OR", val: 0, icon: ")-" },
                { type: "voltmeter", label: "Voltmeter Probe", desc: "Measures voltage drop", val: 0, icon: "⎛" },
                { type: "ldr", label: "LDR Photoresistor", desc: "Light-sensitive resistor", val: 50, icon: "☀" },
                { type: "transistor", label: "NPN Transistor", desc: "BC547 active switch", val: 0, icon: "⏓" },
                { type: "ground", label: "Ground Reference", desc: "0V ground return point", val: 0, icon: "⏚" }
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => spawnComponent(item.type as ComponentType, item.label, item.val)}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-cyan-400 font-mono text-sm font-semibold group-hover:bg-cyan-500/10">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground leading-tight">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="rounded-xl glass border border-border/40 p-1 bg-neutral-950 overflow-hidden relative select-none">
            
            <svg
              ref={canvasRef}
              width="100%"
              height="480"
              className="bg-neutral-900/40 cursor-crosshair rounded-lg"
              style={{
                backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)",
                backgroundSize: "20px 20px"
              }}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onClick={handleCanvasClick}
            >
              {/* RENDERING WIRES */}
              {wires.map((wire) => {
                const start = getPinCanvasCoords(wire.from.componentId, wire.from.pinId);
                const end = getPinCanvasCoords(wire.to.componentId, wire.to.pinId);
                
                const fromPin = `${wire.from.componentId}_${wire.from.pinId}`;
                const toPin = `${wire.to.componentId}_${wire.to.pinId}`;
                const rTop = distToPosState[fromPin] || Infinity;
                const rBottom = distToGndState[fromPin] || Infinity;
                const rLoop = rTop + rBottom;

                const voltage = pinVoltages[fromPin] || 0;
                let wireColor = "#525252";
                let hasCurrent = false;

                if (isSimulating) {
                  if (shortCircuit) {
                    wireColor = "#ef4444";
                  } else if (voltage > 3.0) {
                    wireColor = "#22c55e"; // active High Vcc
                    hasCurrent = true;
                  } else if (voltage > 0) {
                    wireColor = "#eab308"; // lower pulse
                    hasCurrent = true;
                  } else {
                    wireColor = "#06b6d4"; // active GND
                    hasCurrent = true;
                  }
                }

                // Calculate dash speed proportional to loop resistance (Ohm's Law)
                let speedDuration = 0.6;
                if (rLoop !== Infinity) {
                  speedDuration = Math.min(3.0, Math.max(0.18, (rLoop / 330) * 0.4));
                }

                // Check distance to positive source to align flow direction
                const dFrom = distToPosState[fromPin] || Infinity;
                const dTo = distToPosState[toPin] || Infinity;
                const shouldSwap = dFrom > dTo;
                
                const startX = shouldSwap ? end.x : start.x;
                const startY = shouldSwap ? end.y : start.y;
                const endX = shouldSwap ? start.x : end.x;
                const endY = shouldSwap ? start.y : end.y;

                const pathData = getWireCurvePath(startX, startY, endX, endY);

                return (
                  <g key={wire.id} className="group">
                    <path
                      d={pathData}
                      stroke="transparent"
                      strokeWidth="10"
                      fill="none"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWire(wire.id);
                      }}
                    />
                    
                    <path
                      d={pathData}
                      stroke={wireColor}
                      strokeWidth="3"
                      fill="none"
                      className="transition-all duration-300 pointer-events-none"
                    />

                    {isSimulating && hasCurrent && !shortCircuit && (
                      <path
                        d={pathData}
                        stroke={voltage > 2 ? "#a3e635" : "#22d3ee"}
                        strokeWidth="2.5"
                        fill="none"
                        strokeDasharray="6, 16"
                        className="animate-flow-dash pointer-events-none"
                        style={{
                          animationDuration: `${speedDuration}s`
                        }}
                      />
                    )}
                  </g>
                );
              })}

              {/* Rubberband Guide Wire */}
              {wireStart && (
                (() => {
                  const startCoords = getPinCanvasCoords(wireStart.componentId, wireStart.pinId);
                  const pathData = getWireCurvePath(startCoords.x, startCoords.y, mousePos.x, mousePos.y);
                  return (
                    <path
                      d={pathData}
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      fill="none"
                      strokeDasharray="4, 4"
                    />
                  );
                })()
              )}

              {/* RENDER PLACED COMPONENTS */}
              {components.map((comp) => {
                const schema = PIN_SCHEMAS[comp.type] || [];
                const isSelected = comp.id === selectedId;
                const { w, h } = getComponentSize(comp.type);
                const cx = w / 2;
                const cy = h / 2;

                let borderStroke = isSelected ? "#06b6d4" : "#404040";

                return (
                  <g
                    key={comp.id}
                    transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.angle || 0}, ${cx}, ${cy})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(comp.id);
                    }}
                    onMouseDown={(e) => handleComponentStartDrag(comp.id, e, comp.x, comp.y)}
                    className="cursor-move select-none"
                  >
                    <rect
                      x="0"
                      y="0"
                      width={w}
                      height={h}
                      rx="6"
                      fill="#171717"
                      stroke={borderStroke}
                      strokeWidth={isSelected ? 2 : 1.5}
                      className="transition-all hover:stroke-cyan-500/40"
                    />

                    {comp.type === "battery" && (
                      <g transform="translate(15, 20)">
                        <line x1="10" y1="15" x2="40" y2="15" stroke="#f59e0b" strokeWidth="3" />
                        <line x1="20" y1="23" x2="30" y2="23" stroke="#f59e0b" strokeWidth="2.5" />
                        <line x1="10" y1="31" x2="40" y2="31" stroke="#f59e0b" strokeWidth="3" />
                        <text x="25" y="8" fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold">
                          {comp.value}V
                        </text>
                      </g>
                    )}

                    {comp.type === "resistor" && (
                      <g transform="translate(20, 10)">
                        <rect x="0" y="5" width="40" height="10" rx="2" fill="#262626" stroke="#d97706" />
                        {(() => {
                          const bands = getResistorBands(comp.value);
                          return (
                            <g>
                              <rect x="8" y="5.5" width="3" height="9" fill={bands[0]} />
                              <rect x="16" y="5.5" width="3" height="9" fill={bands[1]} />
                              <rect x="24" y="5.5" width="3" height="9" fill={bands[2]} />
                              <rect x="32" y="5.5" width="3" height="9" fill={bands[3]} />
                            </g>
                          );
                        })()}
                        <text x="20" y="-1" fill="#d97706" fontSize="8" textAnchor="middle" className="font-mono">
                          {comp.value >= 1000 ? `${(comp.value/1000).toFixed(1)}k` : comp.value}Ω
                        </text>
                      </g>
                    )}

                    {comp.type === "capacitor" && (
                      <g transform="translate(20, 10)">
                        <line x1="15" y1="0" x2="15" y2="20" stroke="#10b981" strokeWidth="2.5" />
                        <line x1="23" y1="0" x2="23" y2="20" stroke="#10b981" strokeWidth="2.5" />
                        <text x="20" y="-1" fill="#10b981" fontSize="8" textAnchor="middle" className="font-mono">
                          {comp.value}uF
                        </text>
                      </g>
                    )}

                    {comp.type === "potentiometer" && (
                      <g transform="translate(20, 15)">
                        <rect x="0" y="10" width="40" height="12" rx="1" fill="#262626" stroke="#0ea5e9" />
                        <line x1="20" y1="10" x2="20" y2="0" stroke="#0ea5e9" strokeWidth="2" />
                        <polygon points="20,0 16,-4 24,-4" fill="#0ea5e9" />
                        <text x="20" y="27" fill="#0ea5e9" fontSize="8" textAnchor="middle" className="font-mono">
                          {comp.value}%
                        </text>
                      </g>
                    )}

                    {comp.type === "led" && (
                      <g transform="translate(20, 10)">
                        {comp.state.blown ? (
                          <g stroke="#ef4444" strokeWidth="2">
                            <line x1="5" y1="5" x2="35" y2="35" />
                            <line x1="35" y1="5" x2="5" y2="35" />
                            <text x="20" y="25" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">BLOWN</text>
                          </g>
                        ) : (
                          <g>
                            <polygon points="12,10 12,30 28,20" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                            <line x1="28" y1="10" x2="28" y2="30" stroke="#e5e7eb" strokeWidth="2" />
                            <circle
                              cx="20"
                              cy="20"
                              r="7"
                              fill={comp.state.lit ? (comp.color || "red") : "transparent"}
                              className="transition-all duration-300"
                              style={{
                                filter: comp.state.lit ? `drop-shadow(0 0 8px ${comp.color || "red"})` : "none",
                                opacity: comp.state.lit ? 0.75 : 0.2
                              }}
                            />
                          </g>
                        )}
                      </g>
                    )}

                    {comp.type === "ldr" && (
                      <g transform="translate(15, 10)">
                        <circle cx="25" cy="20" r="16" fill="#1f2937" stroke="#eab308" strokeWidth="1.5" />
                        <path d="M 13 20 C 17 12, 17 28, 21 20 C 25 12, 25 28, 29 20 C 33 12, 33 28, 37 20" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 6 -3 L 11 2 M 11 -6 L 15 -1" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
                        <text x="25" y="47" fill="#eab308" fontSize="8" textAnchor="middle" className="font-mono">
                          {comp.value}% Light
                        </text>
                      </g>
                    )}

                    {comp.type === "transistor" && (
                      <g transform="translate(20, 15)">
                        <circle cx="20" cy="25" r="18" fill="none" stroke="#6366f1" strokeWidth="1.8" />
                        <line x1="12" y1="13" x2="12" y2="37" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
                        <line x1="-10" y1="25" x2="12" y2="25" stroke="#a3a3a3" strokeWidth="1.5" />
                        <line x1="12" y1="18" x2="28" y2="6" stroke="#e5e7eb" strokeWidth="2" />
                        <line x1="20" y1="-5" x2="20" y2="12" stroke="#a3a3a3" strokeWidth="1.5" />
                        <line x1="12" y1="32" x2="28" y2="44" stroke="#e5e7eb" strokeWidth="2" />
                        <polygon points="28,44 24,37 20,41" fill="#e5e7eb" />
                        <line x1="20" y1="40" x2="20" y2="55" stroke="#a3a3a3" strokeWidth="1.5" />
                        <text x="16" y="4" fill="#a3a3a3" fontSize="6.5" className="font-sans font-bold">C</text>
                        <text x="-5" y="21" fill="#a3a3a3" fontSize="6.5" className="font-sans font-bold">B</text>
                        <text x="16" y="50" fill="#a3a3a3" fontSize="6.5" className="font-sans font-bold">E</text>
                      </g>
                    )}

                    {comp.type === "buzzer" && (
                      <g transform="translate(20, 15)">
                        <circle cx="20" cy="15" r="10" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                        <line x1="12" y1="15" x2="28" y2="15" stroke="#8b5cf6" strokeWidth="2" />
                        <line x1="20" y1="7" x2="20" y2="23" stroke="#8b5cf6" strokeWidth="2" />
                        <text x="20" y="32" fill="#8b5cf6" fontSize="7.5" textAnchor="middle" className="font-mono">
                          {comp.value}Hz
                        </text>
                      </g>
                    )}

                    {comp.type === "voltmeter" && (
                      <g transform="translate(15, 10)">
                        {/* LCD readout display */}
                        <rect x="0" y="7" width="50" height="20" fill="#022c22" stroke="#059669" rx="2" />
                        <text x="25" y="21" fill="#34d399" fontSize="10.5" fontWeight="bold" textAnchor="middle" className="font-mono">
                          {comp.state.voltageReadout !== undefined ? comp.state.voltageReadout.toFixed(2) : "0.00"}V
                        </text>
                        <text x="25" y="1" fill="#737373" fontSize="7" fontWeight="bold" textAnchor="middle" className="font-mono">V-METER</text>
                      </g>
                    )}

                    {comp.type === "switch" && (
                      <g transform="translate(15, 10)" onClick={(e) => handleComponentInteraction(e, comp)}>
                        <circle cx="10" cy="10" r="3" fill="#60a5fa" />
                        <circle cx="50" cy="10" r="3" fill="#60a5fa" />
                        {comp.state.toggled ? (
                          <line x1="10" y1="10" x2="50" y2="10" stroke="#60a5fa" strokeWidth="3" />
                        ) : (
                          <line x1="10" y1="10" x2="45" y2="-5" stroke="#60a5fa" strokeWidth="3" />
                        )}
                      </g>
                    )}

                    {comp.type === "button" && (
                      <g
                        transform="translate(15, 10)"
                        onMouseDown={() => handleButtonPress(comp, true)}
                        onMouseUp={() => handleButtonPress(comp, false)}
                        onMouseLeave={() => handleButtonPress(comp, false)}
                      >
                        <circle cx="10" cy="10" r="2.5" fill="#10b981" />
                        <circle cx="50" cy="10" r="2.5" fill="#10b981" />
                        <line x1="20" y1="10" x2="40" y2="10" stroke="#10b981" strokeWidth="2.5" />
                        <line x1="30" y1="10" x2="30" y2={comp.state.pressed ? 7 : 4} stroke="#10b981" strokeWidth="2.5" />
                        <rect x="22" y="1" width="16" height="3.5" fill="#10b981" />
                      </g>
                    )}

                    {comp.type === "timer555" && (
                      <g transform="translate(15, 15)">
                        <rect x="0" y="0" width="70" height="90" rx="3" fill="#171717" stroke="#8b5cf6" strokeWidth="1" />
                        <text x="35" y="50" fill="#8b5cf6" fontSize="12" fontWeight="bold" textAnchor="middle" className="font-mono">NE555</text>
                        <circle cx="12" cy="12" r="3" fill="#8b5cf6" opacity="0.6" />
                      </g>
                    )}

                    {comp.type === "gateNot" && (
                      <g transform="translate(15, 5)">
                        <polygon points="15,10 15,30 35,20" fill="none" stroke="#f472b6" strokeWidth="2" />
                        <circle cx="38" cy="20" r="3" fill="none" stroke="#f472b6" strokeWidth="2" />
                      </g>
                    )}

                    {comp.type === "gateAnd" && (
                      <g transform="translate(15, 10)">
                        <path d="M 15 10 L 30 10 A 15 15 0 0 1 30 40 L 15 40 Z" fill="none" stroke="#6366f1" strokeWidth="2" />
                        <text x="24" y="30" fill="#6366f1" fontSize="9" fontWeight="bold">AND</text>
                      </g>
                    )}

                    {comp.type === "gateOr" && (
                      <g transform="translate(15, 10)">
                        <path d="M 15 10 C 20 20, 20 30, 15 40 C 25 40, 35 35, 45 25 C 35 15, 25 10, 15 10" fill="none" stroke="#38bdf8" strokeWidth="2" />
                        <text x="22" y="29" fill="#38bdf8" fontSize="9" fontWeight="bold">OR</text>
                      </g>
                    )}

                    {comp.type === "ground" && (
                      <g transform="translate(10, 10)">
                        <line x1="20" y1="5" x2="20" y2="20" stroke="#a3a3a3" strokeWidth="2" />
                        <line x1="5" y1="20" x2="35" y2="20" stroke="#a3a3a3" strokeWidth="3" />
                        <line x1="10" y1="26" x2="30" y2="26" stroke="#a3a3a3" strokeWidth="2" />
                        <line x1="15" y1="32" x2="25" y2="32" stroke="#a3a3a3" strokeWidth="1" />
                      </g>
                    )}

                    {/* Component Label */}
                    <text
                      x={w / 2}
                      y={h + 15}
                      fill={isSelected ? "#22d3ee" : "#a3a3a3"}
                      fontSize="9.5"
                      fontWeight={isSelected ? "bold" : "normal"}
                      textAnchor="middle"
                      className="font-sans pointer-events-none"
                    >
                      {comp.label}
                    </text>

                    {/* RENDERING PIN NODES */}
                    {schema.map((pin) => {
                      const isConnectingStart = wireStart && wireStart.componentId === comp.id && wireStart.pinId === pin.pinId;
                      const isTargetCandidate = wireStart && wireStart.componentId !== comp.id;
                      
                      return (
                        <g key={pin.pinId}>
                          {isTargetCandidate && (
                            <circle
                              cx={pin.x}
                              cy={pin.y}
                              r="9.5"
                              fill="transparent"
                              stroke="#22d3ee"
                              className="pointer-events-none animate-pin-glow"
                            />
                          )}
                          
                          <circle
                            cx={pin.x}
                            cy={pin.y}
                            r="5.5"
                            fill={isConnectingStart ? "#22d3ee" : "#262626"}
                            stroke={isConnectingStart ? "#22d3ee" : borderStroke}
                            strokeWidth="2"
                            className="pointer-events-none"
                          />

                          {isSimulating && (
                            (() => {
                              const volt = pinVoltages[`${comp.id}_${pin.pinId}`];
                              if (volt === undefined) return null;
                              return (
                                <g transform={`translate(${pin.x}, ${pin.y - 12})`} className="pointer-events-none">
                                  <rect
                                    x="-14"
                                    y="-7"
                                    width="28"
                                    height="12"
                                    rx="2"
                                    fill="#09090b"
                                    stroke="#22d3ee"
                                    strokeWidth="0.5"
                                    opacity="0.85"
                                  />
                                  <text
                                    fill="#22d3ee"
                                    fontSize="7.5"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    y="1.5"
                                    className="font-mono"
                                  >
                                    {volt.toFixed(1)}V
                                  </text>
                                </g>
                              );
                            })()
                          )}

                          {/* Large invisible hit target circle */}
                          <circle
                            cx={pin.x}
                            cy={pin.y}
                            r="15"
                            fill="transparent"
                            className="cursor-pointer"
                            onClick={(e) => handlePinClick(e, comp.id, pin.pinId)}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <title>{pin.label}</title>
                          </circle>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Console logs */}
          <div className="rounded-xl glass border border-border/40 p-4 bg-neutral-950/70 space-y-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h3 className="text-xs font-semibold font-mono text-cyan-400 flex items-center gap-1.5 uppercase">
                <Activity size={14} />
                <span>Simulation Console Output</span>
              </h3>
              <button
                onClick={() => setCircuitLogs([])}
                className="text-[10px] text-muted-foreground hover:text-foreground hover:underline transition-all"
              >
                Clear Logs
              </button>
            </div>
            
            <div className="h-28 overflow-y-auto space-y-1 pr-1 font-mono text-xs text-left">
              {circuitLogs.length === 0 ? (
                <div className="text-muted-foreground italic text-center py-6">
                  No logs available. Deploy components and click "Run Simulation" to start.
                </div>
              ) : (
                circuitLogs.map((log) => {
                  let badgeColor = "text-muted-foreground";
                  if (log.type === "success") badgeColor = "text-emerald-400";
                  if (log.type === "warning") badgeColor = "text-yellow-500";
                  if (log.type === "error") badgeColor = "text-red-500 font-bold";

                  return (
                    <div key={log.id} className="flex gap-2 leading-relaxed">
                      <span className="text-neutral-600 select-none">[{log.timestamp}]</span>
                      <span className={badgeColor}>{log.text}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right side inspector: col-span-3 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl glass border border-border/40 p-4 space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Sliders size={15} />
              <span>Inspector</span>
            </h3>

            {selectedComp ? (
              <div className="space-y-4 text-left">
                {/* Details card */}
                <div className="p-3 rounded-lg bg-neutral-900 border border-border/60">
                  <div className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                    {selectedComp.type} Parameters
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {selectedComp.label}
                  </div>
                  {/* Rotate control */}
                  <div className="mt-3 flex justify-between items-center border-t border-border/40 pt-2.5">
                    <span className="text-xs text-muted-foreground">Orientation</span>
                    <button
                      onClick={rotateSelectedComponent}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-850 hover:bg-neutral-800 border border-border text-[11px] text-foreground rounded-lg transition-colors"
                    >
                      <RotateCw size={12} />
                      <span>{selectedComp.angle || 0}°</span>
                    </button>
                  </div>
                </div>

                {/* Battery voltage slider */}
                {selectedComp.type === "battery" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex justify-between">
                      <span>Source Voltage</span>
                      <span className="text-cyan-400 font-mono">{selectedComp.value}V</span>
                    </label>
                    <input
                      type="range"
                      min="1.5"
                      max="24"
                      step="0.5"
                      value={selectedComp.value}
                      onChange={(e) => updateSelectedValue(parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                )}

                {/* Resistor slider */}
                {selectedComp.type === "resistor" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex justify-between">
                      <span>Resistance Value</span>
                      <span className="text-cyan-400 font-mono">
                        {selectedComp.value >= 1000 ? `${(selectedComp.value/1000).toFixed(1)}k` : selectedComp.value}Ω
                      </span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="10000"
                      step="10"
                      value={selectedComp.value}
                      onChange={(e) => updateSelectedValue(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex gap-1 pt-1 justify-start">
                      {getResistorBands(selectedComp.value).map((band, idx) => (
                        <span
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full border text-[8px] flex items-center justify-center font-semibold capitalize ${BAND_COLOR_CLASSES[band]}`}
                          title={`${band} band`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Capacitor slider */}
                {selectedComp.type === "capacitor" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex justify-between">
                      <span>Capacitance</span>
                      <span className="text-cyan-400 font-mono">{selectedComp.value}uF</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="1000"
                      step="10"
                      value={selectedComp.value}
                      onChange={(e) => updateSelectedValue(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                )}

                {/* Potentiometer slider */}
                {selectedComp.type === "potentiometer" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex justify-between">
                      <span>Wiper Position</span>
                      <span className="text-cyan-400 font-mono">{selectedComp.value}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={selectedComp.value}
                      onChange={(e) => updateSelectedValue(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                )}

                {/* Buzzer slider */}
                {selectedComp.type === "buzzer" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex justify-between">
                      <span>Buzzer Tone Pitch</span>
                      <span className="text-cyan-400 font-mono">{selectedComp.value}Hz</span>
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="3000"
                      step="50"
                      value={selectedComp.value}
                      onChange={(e) => updateSelectedValue(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                )}

                {/* LED color picker */}
                {selectedComp.type === "led" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">LED Color</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: "red", colorClass: "bg-red-500" },
                        { value: "green", colorClass: "bg-green-500" },
                        { value: "blue", colorClass: "bg-blue-500" },
                        { value: "yellow", colorClass: "bg-yellow-500" }
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => updateSelectedColor(item.value)}
                          className={`p-2.5 rounded border text-[10px] text-center font-medium capitalize transition-colors ${
                            selectedComp.color === item.value
                              ? "border-cyan-500 text-foreground bg-neutral-850"
                              : "border-border/60 text-muted-foreground hover:border-cyan-500/20"
                          }`}
                        >
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${item.colorClass}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voltmeter description */}
                {selectedComp.type === "voltmeter" && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Measures voltage difference (V_diff) between probe leads.
                    </p>
                    <p className="font-mono text-cyan-400 text-[10px] mt-2">
                      Current display: {selectedComp.state.voltageReadout !== undefined ? selectedComp.state.voltageReadout.toFixed(2) : "0.00"}V
                    </p>
                  </div>
                )}

                {/* LDR light slider */}
                {selectedComp.type === "ldr" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex justify-between">
                      <span>Ambient Light Level</span>
                      <span className="text-cyan-400 font-mono">{selectedComp.value}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={selectedComp.value}
                      onChange={(e) => updateSelectedValue(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="text-[10px] text-muted-foreground italic mt-1 leading-normal">
                      Calculated resistance: {
                        (() => {
                          const light = selectedComp.value;
                          const r = 100 + (10000 - 100) * (1 - light / 100);
                          return r >= 1000 ? `${(r / 1000).toFixed(1)}k` : `${r.toFixed(0)}`;
                        })()
                      }Ω. (Brighter light lowers resistance).
                    </div>
                  </div>
                )}

                {/* Transistor NPN description */}
                {selectedComp.type === "transistor" && (
                  <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
                    <p>
                      <strong className="text-foreground">BC547 NPN Bipolar Junction Transistor.</strong>
                    </p>
                    <p className="mt-1">
                      Acts as an active current valve or solid-state switch. When Base-to-Emitter potential difference exceeds <span className="text-cyan-400">0.7V</span>, the Collector-to-Emitter channel turns ON (conducts with low resistance).
                    </p>
                    <div className="font-mono text-[9px] text-cyan-400 mt-2.5 p-1.5 rounded bg-neutral-900 border border-border/40">
                      V_BE: {
                        (() => {
                          const vB = pinVoltages[`${selectedComp.id}_base`] || 0;
                          const vE = pinVoltages[`${selectedComp.id}_emitter`] || 0;
                          return Math.max(0, parseFloat((vB - vE).toFixed(2)));
                        })()
                      }V | {
                        (() => {
                          const vB = pinVoltages[`${selectedComp.id}_base`] || 0;
                          const vE = pinVoltages[`${selectedComp.id}_emitter`] || 0;
                          return (vB - vE) > 0.7 ? "🟢 ON (CONDUCTING)" : "🔴 OFF (BLOCKED)";
                        })()
                      }
                    </div>
                  </div>
                )}

                {/* Real-time Oscilloscope */}
                {isSimulating && oscilloscopeHistory.length > 0 && (
                  <div className="space-y-1.5 border-t border-border/40 pt-3">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Activity size={13} className="text-green-500" />
                      <span>Live Oscilloscope</span>
                    </label>
                    <div className="h-28 rounded border border-green-600 bg-emerald-950/60 relative overflow-hidden">
                      <svg width="100%" height="100%" className="absolute inset-0">
                        <line x1="0" y1="28" x2="250" y2="28" stroke="#16a34a" strokeWidth="0.5" strokeDasharray="2, 2" />
                        <line x1="0" y1="56" x2="250" y2="56" stroke="#16a34a" strokeWidth="0.5" strokeDasharray="2, 2" />
                        <line x1="0" y1="84" x2="250" y2="84" stroke="#16a34a" strokeWidth="0.5" strokeDasharray="2, 2" />
                        
                        <polyline
                          fill="none"
                          stroke="#a3e635"
                          strokeWidth="2"
                          style={{ filter: "drop-shadow(0 0 3px #15803d)" }}
                          points={oscilloscopeHistory
                            .map((v, i) => {
                              const x = (i / 49) * 200;
                              const y = 105 - (v / 12) * 90;
                              return `${x},${y}`;
                            })
                            .join(" ")}
                        />
                      </svg>
                      <div className="absolute top-1 right-2 text-[9px] font-mono text-green-400">
                        SCALE: 3V / Div
                      </div>
                      <div className="absolute bottom-1 left-2 text-[9px] font-mono text-green-400">
                        OUT: {oscilloscopeHistory[oscilloscopeHistory.length - 1]?.toFixed(1)}V
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete button */}
                <button
                  onClick={() => deleteComponent(selectedComp.id)}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 px-3 py-2 border border-red-500/30 hover:border-red-500/80 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Delete Component</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic text-center py-10">
                No component selected. Select an item in the workspace to view parameters.
              </div>
            )}
          </div>

          <div className="rounded-xl glass border border-border/40 p-4 space-y-3 text-left">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Info size={14} />
              <span>Sandbox Tips</span>
            </h3>
            <ul className="text-[10px] text-muted-foreground space-y-2 list-disc pl-4 leading-normal">
              <li>
                <strong className="text-foreground">Voltmeter:</strong> Wire the positive (+) and negative (-) leads across components to check exact voltage drops.
              </li>
              <li>
                <strong className="text-foreground">Resistor Protection:</strong> Ensure resistors are in-path with LEDs under 9V to avoid blown fuses.
              </li>
              <li>
                <strong className="text-foreground">Ohm's Law:</strong> Adjust resistance values to see visual electron speeds slow down or speed up.
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}

function getWireCurvePath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  const offset = Math.max(dx * 0.45, dy * 0.25, 45);
  return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
}

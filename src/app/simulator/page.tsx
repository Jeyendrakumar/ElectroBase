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
  | "buzzer";

interface ComponentInstance {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  label: string;
  value: number; // Volts for battery, Ohms for resistor, Frequency for 555 / buzzer, position % for potentiometer, uF for capacitor
  angle: number; // Rotation angle (0, 90, 180, 270)
  state: {
    toggled?: boolean; // switch state
    pressed?: boolean; // button state
    blown?: boolean; // LED blown state
    lit?: boolean; // LED light state
    outputHigh?: boolean; // Gate / 555 output state
    potValue?: number; // slider override
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
    case "gateAnd":
    case "gateOr": return { w: 90, h: 80 };
    case "led":
    case "gateNot":
    case "potentiometer":
    case "buzzer": return { w: 80, h: 60 };
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

  // Simulated node potentials
  const [netStates, setNetStates] = useState<Record<string, { voltage: number; isShortCircuit: boolean }>>({});

  // Real-time oscilloscope values
  const [oscilloscopeHistory, setOscilloscopeHistory] = useState<number[]>([]);

  // Presets load/save states
  const [saveSlotName, setSaveSlotName] = useState("");
  const [customPresetsList, setCustomPresetsList] = useState<string[]>([]);

  // Web Audio Context Synthesizer Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<Record<string, { osc: OscillatorNode; gain: GainNode }>>({});

  // ----------------------------------------------------
  // Local Custom Presets Listing
  // ----------------------------------------------------
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
      }, 80); // 80ms ticks for faster osc updates
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
      // Initialize Audio Context on user event
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
      
      // Reset component simulation states
      setComponents((prev) =>
        prev.map((c) => ({
          ...c,
          state: {
            ...c.state,
            lit: false,
            outputHigh: false
          }
        }))
      );
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

    // Mathematical rotation coordinates around component center
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
  // Electrical Loop Solver
  // ----------------------------------------------------
  useEffect(() => {
    if (!isSimulating) {
      setNetStates({});
      return;
    }

    // 1. Gather all pins
    const pinIds: string[] = [];
    components.forEach((c) => {
      const pins = PIN_SCHEMAS[c.type] || [];
      pins.forEach((p) => {
        pinIds.push(`${c.id}_${p.pinId}`);
      });
    });

    // 2. Disjoint-Set union merge logic
    const parent: Record<string, string> = {};
    pinIds.forEach((p) => (parent[p] = p));

    function find(i: string): string {
      if (parent[i] === i) return i;
      parent[i] = find(parent[i]);
      return parent[i];
    }

    function union(i: string, j: string) {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) parent[rootI] = rootJ;
    }

    // Merge wires
    wires.forEach((w) => {
      const p1 = `${w.from.componentId}_${w.from.pinId}`;
      const p2 = `${w.to.componentId}_${w.to.pinId}`;
      if (parent[p1] && parent[p2]) {
        union(p1, p2);
      }
    });

    // Merge internal connected networks (switches, buttons, potentiometers)
    components.forEach((c) => {
      if (c.type === "switch" && c.state.toggled) {
        union(`${c.id}_p1`, `${c.id}_p2`);
      }
      if (c.type === "button" && c.state.pressed) {
        union(`${c.id}_p1`, `${c.id}_p2`);
      }
      // If potentiometer wiper is at 0% or 100%, connect wiper directly
      if (c.type === "potentiometer") {
        const wiperPos = c.value; // value tracks 0-100% position
        if (wiperPos <= 5) {
          union(`${c.id}_wiper`, `${c.id}_p1`);
        } else if (wiperPos >= 95) {
          union(`${c.id}_wiper`, `${c.id}_p2`);
        }
      }
    });

    // Build lists of nets
    const nets: Record<string, string[]> = {};
    pinIds.forEach((p) => {
      const root = find(p);
      if (!nets[root]) nets[root] = [];
      nets[root].push(p);
    });

    // 3. Solve Net Potentials
    const calculatedNets: Record<string, { voltage: number; isShortCircuit: boolean }> = {};
    const batteryPosRoots = new Set<string>();
    const batteryNegRoots = new Set<string>();
    const gndRoots = new Set<string>();
    const activeHighRoots = new Set<string>();
    const activeLowRoots = new Set<string>();

    components.forEach((c) => {
      if (c.type === "battery") {
        batteryPosRoots.add(find(`${c.id}_pos`));
        batteryNegRoots.add(find(`${c.id}_neg`));
      }
      if (c.type === "ground") {
        gndRoots.add(find(`${c.id}_gnd`));
      }

      // 555 Timer Oscillation logic
      if (c.type === "timer555") {
        const vccRoot = find(`${c.id}_VCC`);
        const gndRoot = find(`${c.id}_GND`);
        const isPowered = Array.from(batteryPosRoots).some(r => r === vccRoot) &&
                          (Array.from(batteryNegRoots).some(r => r === gndRoot) || Array.from(gndRoots).some(r => r === gndRoot));
        
        if (isPowered) {
          // Toggle high/low on timeTick intervals
          const isHigh = Math.floor(timeTick / 4) % 2 === 0;
          const outRoot = find(`${c.id}_OUT`);
          if (isHigh) {
            activeHighRoots.add(outRoot);
          } else {
            activeLowRoots.add(outRoot);
          }
        }
      }

      // Logic gates resolver
      if (c.type === "gateNot") {
        const inRoot = find(`${c.id}_in`);
        const outRoot = find(`${c.id}_out`);
        const isHigh = Array.from(batteryPosRoots).some(r => r === inRoot) || Array.from(activeHighRoots).some(r => r === inRoot);
        if (!isHigh) activeHighRoots.add(outRoot);
        else activeLowRoots.add(outRoot);
      }

      if (c.type === "gateAnd" || c.type === "gateOr") {
        const in1Root = find(`${c.id}_in1`);
        const in2Root = find(`${c.id}_in2`);
        const outRoot = find(`${c.id}_out`);
        const is1High = Array.from(batteryPosRoots).some(r => r === in1Root) || Array.from(activeHighRoots).some(r => r === in1Root);
        const is2High = Array.from(batteryPosRoots).some(r => r === in2Root) || Array.from(activeHighRoots).some(r => r === in2Root);

        const ok = c.type === "gateAnd" ? (is1High && is2High) : (is1High || is2High);
        if (ok) activeHighRoots.add(outRoot);
        else activeLowRoots.add(outRoot);
      }
    });

    // Detect Short Circuits
    let shortCircuitDetected = false;
    batteryPosRoots.forEach((pos) => {
      if (batteryNegRoots.has(pos) || gndRoots.has(pos) || activeLowRoots.has(pos)) {
        shortCircuitDetected = true;
      }
    });

    // Set voltage numbers on net potentials
    Object.keys(nets).forEach((netRoot) => {
      let v = 0;
      if (batteryPosRoots.has(netRoot) || activeHighRoots.has(netRoot)) {
        const batteries = components.filter(c => c.type === "battery" && find(`${c.id}_pos`) === netRoot);
        v = batteries.length > 0 ? Math.max(...batteries.map(b => b.value)) : 5;
      } else if (batteryNegRoots.has(netRoot) || gndRoots.has(netRoot) || activeLowRoots.has(netRoot)) {
        v = 0;
      } else {
        // Floating trace
        const hasPos = Array.from(batteryPosRoots).some(p => p === netRoot) || Array.from(activeHighRoots).some(p => p === netRoot);
        v = hasPos ? 5 : 0;
      }

      calculatedNets[netRoot] = {
        voltage: v,
        isShortCircuit: shortCircuitDetected
      };
    });

    setNetStates(calculatedNets);

    // 4. Update LEDs and Audio Buzzers
    let ledOverload = false;
    const activeBuzzers = new Set<string>();

    setComponents((prev) =>
      prev.map((c) => {
        // LED calculation
        if (c.type === "led") {
          if (c.state.blown) return c;
          const anodeRoot = find(`${c.id}_anode`);
          const cathodeRoot = find(`${c.id}_cathode`);
          const anodeState = calculatedNets[anodeRoot] || { voltage: 0, isShortCircuit: false };
          const cathodeState = calculatedNets[cathodeRoot] || { voltage: 0, isShortCircuit: false };

          const deltaV = anodeState.voltage - cathodeState.voltage;
          const lit = deltaV > 1.8 && !shortCircuitDetected;
          let blown = false;

          // Overcurrent overload if directly connected to > 3V source
          const isDirectHigh = Array.from(batteryPosRoots).some(r => r === anodeRoot);
          const batteriesHigh = components.filter(comp => comp.type === "battery" && find(`${comp.id}_pos`) === anodeRoot);
          const highestBat = batteriesHigh.length > 0 ? Math.max(...batteriesHigh.map(b => b.value)) : 0;

          if (isDirectHigh && highestBat > 3.0) {
            blown = true;
            ledOverload = true;
          }

          return { ...c, state: { ...c.state, lit, blown: blown || c.state.blown } };
        }

        // Buzzer calculation
        if (c.type === "buzzer") {
          const posRoot = find(`${c.id}_pos`);
          const negRoot = find(`${c.id}_neg`);
          const posState = calculatedNets[posRoot] || { voltage: 0, isShortCircuit: false };
          const negState = calculatedNets[negRoot] || { voltage: 0, isShortCircuit: false };

          const deltaV = posState.voltage - negState.voltage;
          const isPowered = deltaV > 2.0 && !shortCircuitDetected;

          if (isPowered) {
            activeBuzzers.add(c.id);
          }
          return c;
        }

        return c;
      })
    );

    if (shortCircuitDetected) {
      addLog("⚠️ SHORT CIRCUIT DETECTED! Shading currents off.", "error");
    }
    if (ledOverload) {
      addLog("💥 LED OVERLOAD! Added high direct volts without a resistor.", "error");
    }

    // Audio synthesizer manager
    if (audioCtxRef.current && !isMuted) {
      components.forEach((c) => {
        if (c.type !== "buzzer") return;

        const isPowered = activeBuzzers.has(c.id);
        const oscEntry = oscillatorsRef.current[c.id];

        if (isPowered) {
          // If powered but osc doesn't exist, create it
          if (!oscEntry) {
            try {
              const ctx = audioCtxRef.current!;
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              
              // Set type to triangle for a piezo beep tone
              osc.type = "sine";
              // Value represents buzzer frequency slider
              osc.frequency.value = c.value || 1000;
              
              gain.gain.value = 0.03; // low soft beep
              
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              
              oscillatorsRef.current[c.id] = { osc, gain };
              addLog(`🔊 Buzzer tone sounding at ${c.value || 1000}Hz.`, "info");
            } catch(e) {
              console.error("Audio Context trigger failed:", e);
            }
          } else {
            // Update oscillator frequency in case it was slid
            oscEntry.osc.frequency.setValueAtTime(c.value || 1000, audioCtxRef.current!.currentTime);
            oscEntry.gain.gain.setValueAtTime(0.03, audioCtxRef.current!.currentTime); // unmute/ensure active
          }
        } else {
          // If not powered, set volume to 0 (muting is safer than stopping)
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

    // Read voltage of output/primary pin
    const outPin = schema.find(p => p.pinId === "OUT" || p.pinId === "out" || p.pinId === "wiper" || p.pinId === "pos");
    const pinId = outPin ? outPin.pinId : schema[0].pinId;
    const pinName = `${selectedComp.id}_${pinId}`;

    const netKey = Object.keys(netStates).find(root => root.includes(pinName) || pinName.includes(root));
    const voltVal = netKey && netStates[netKey] ? netStates[netKey].voltage : 0;

    setOscilloscopeHistory((prev) => [...prev, voltVal].slice(-50));

  }, [timeTick, selectedId, isSimulating]);

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
      value: type === "potentiometer" ? 50 : type === "buzzer" ? 1000 : value, // potentiometer defaults to 50% wiper, buzzer to 1000Hz
      angle: 0,
      state: {
        toggled: false,
        pressed: false,
        blown: false,
        lit: false,
        outputHigh: false
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
    
    // Stop oscillator if deleting active buzzer
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

  // Component orientation rotation (90 degrees steps)
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

  // ----------------------------------------------------
  // Canvas Mouse & Drag Mechanics
  // ----------------------------------------------------
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

  // Selected item inspectors value overrides
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
      addLog("Enter a valid name to save your preset.", "warning");
      return;
    }
    const data = JSON.stringify({ components, wires });
    localStorage.setItem(`electrobase_user_preset_${saveSlotName.trim()}`, data);
    addLog(`Preset "${saveSlotName.trim()}" saved to local storage.`, "success");
    
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
      addLog("Failed to parse preset layout.", "error");
    }
  };

  const handleDeletePreset = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(`electrobase_user_preset_${name}`);
    addLog(`Deleted preset "${name}".`, "info");
    
    // Refresh presets list
    const keys = Object.keys(localStorage).filter(k => k.startsWith("electrobase_user_preset_"));
    setCustomPresetsList(keys.map(k => k.replace("electrobase_user_preset_", "")));
  };

  // ----------------------------------------------------
  // Built-in Static Templates Loader
  // ----------------------------------------------------
  const loadBuiltInTemplate = (templateName: "simpleLed" | "logicAnd" | "blinker555") => {
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
        // Out Pin 3 connected to both LED & Buzzer pos
        { id: "w5", from: { componentId: timerId, pinId: "OUT" }, to: { componentId: ledId, pinId: "anode" } },
        { id: "w6", from: { componentId: timerId, pinId: "OUT" }, to: { componentId: bzId, pinId: "pos" } },
        // Ground returns
        { id: "w7", from: { componentId: ledId, pinId: "cathode" }, to: { componentId: "gnd_1", pinId: "gnd" } },
        { id: "w8", from: { componentId: bzId, pinId: "neg" }, to: { componentId: "gnd_1", pinId: "gnd" } }
      ]);

      addLog("Loaded 555 Blinker & Buzzer template.", "success");
    }
  };

  const selectedComp = components.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* Visual wire flow speed keyframes */}
      <style>{`
        @keyframes flowAnim {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .animate-flow-dash {
          animation: flowAnim 0.6s linear infinite;
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
          {/* Mute button */}
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

      {/* Preset Circuits & Templates */}
      <div className="rounded-xl glass border border-border/40 p-4 grid gap-4 lg:grid-cols-12 items-center">
        {/* Built-ins */}
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
            ⏱️ 555 Blinker + Buzzer
          </button>
          <button
            onClick={resetLEDs}
            className="px-2 py-1 rounded border border-red-500/20 bg-red-950/20 text-xs text-red-400 hover:bg-red-950/40 transition-colors"
          >
            🔧 Fix LEDs
          </button>
        </div>

        {/* Custom Presets Local Storage Save/Load */}
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
                  e.target.value = ""; // reset selection
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
        
        {/* Left components menu: col-span-3 */}
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
                { type: "gateAnd", label: "Logic AND", desc: "Output high if both inputs high", val: 0, icon: "D-" },
                { type: "gateOr", label: "Logic OR", desc: "Output high if either input high", val: 0, icon: ")-" },
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

        {/* Center Canvas Workspace: col-span-6 */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="rounded-xl glass border border-border/40 p-1 bg-neutral-950 overflow-hidden relative select-none">
            
            {/* SVG Interactive Canvas */}
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
                
                const rootNet = Object.keys(netStates).find((root) => {
                  const pId = `${wire.from.componentId}_${wire.from.pinId}`;
                  return pId.includes(root) || root.includes(pId);
                });

                const state = rootNet ? netStates[rootNet] : null;
                const isShort = state?.isShortCircuit || false;
                const voltage = state?.voltage || 0;

                let wireColor = "#525252";
                let hasCurrent = false;

                if (isSimulating) {
                  if (isShort) {
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

                const pathData = getWireStraightPath(start.x, start.y, end.x, end.y);

                return (
                  <g key={wire.id} className="group">
                    {/* Wider hit path for click-to-delete */}
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
                    
                    {/* Visual wire */}
                    <path
                      d={pathData}
                      stroke={wireColor}
                      strokeWidth="3"
                      fill="none"
                      className="transition-all duration-300 pointer-events-none"
                    />

                    {/* Electron speed animation */}
                    {isSimulating && hasCurrent && !isShort && (
                      <path
                        d={pathData}
                        stroke={voltage > 2 ? "#a3e635" : "#22d3ee"}
                        strokeWidth="2.5"
                        fill="none"
                        strokeDasharray="6, 16"
                        className="animate-flow-dash pointer-events-none"
                      />
                    )}
                  </g>
                );
              })}

              {/* Rubberband Wire */}
              {wireStart && (
                (() => {
                  const startCoords = getPinCanvasCoords(wireStart.componentId, wireStart.pinId);
                  return (
                    <line
                      x1={startCoords.x}
                      y1={startCoords.y}
                      x2={mousePos.x}
                      y2={mousePos.y}
                      stroke="#06b6d4"
                      strokeWidth="2.5"
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
                    {/* Outer card shape */}
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

                    {/* Graphic overlays per type */}
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
                        {/* Capacitor parallel lines */}
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

                    {comp.type === "buzzer" && (
                      <g transform="translate(20, 15)">
                        {/* Audio speaker symbol */}
                        <circle cx="20" cy="15" r="10" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                        <line x1="12" y1="15" x2="28" y2="15" stroke="#8b5cf6" strokeWidth="2" />
                        <line x1="20" y1="7" x2="20" y2="23" stroke="#8b5cf6" strokeWidth="2" />
                        <text x="20" y="32" fill="#8b5cf6" fontSize="7.5" textAnchor="middle" className="font-mono">
                          {comp.value}Hz
                        </text>
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
                      return (
                        <circle
                          key={pin.pinId}
                          cx={pin.x}
                          cy={pin.y}
                          r="5.5"
                          fill={isConnectingStart ? "#22d3ee" : "#262626"}
                          stroke={isConnectingStart ? "#22d3ee" : borderStroke}
                          strokeWidth="2"
                          className="hover:scale-130 transition-transform cursor-pointer"
                          onClick={(e) => handlePinClick(e, comp.id, pin.pinId)}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <title>{pin.label}</title>
                        </circle>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Console Output Logs */}
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

        {/* Right side parameters panel: col-span-3 */}
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
                  {/* Rotate Control */}
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

                {/* Potentiometer dial position slider */}
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
                    <p className="text-[9.5px] text-neutral-500">
                      Alters resistance divider path. 0% connects wiper pin directly to Terminal 1.
                    </p>
                  </div>
                )}

                {/* Buzzer frequency slider */}
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

                {/* LED controls */}
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

                {/* Real-time Oscilloscope Signal Graph */}
                {isSimulating && oscilloscopeHistory.length > 0 && (
                  <div className="space-y-1.5 border-t border-border/40 pt-3">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Activity size={13} className="text-green-500" />
                      <span>Live Oscilloscope</span>
                    </label>
                    <div className="h-28 rounded border border-green-600 bg-emerald-950/60 relative overflow-hidden">
                      {/* Plot SVG lines */}
                      <svg width="100%" height="100%" className="absolute inset-0">
                        {/* Grid lines */}
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
                              // map voltage (0 to 12V) to graph height (112px bottom to 5px top)
                              const x = (i / 49) * 200; // fit width
                              const y = 105 - (v / 12) * 90; // fit height
                              return `${x},${y}`;
                            })
                            .join(" ")}
                        />
                      </svg>
                      {/* Overlay parameters */}
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
                <strong className="text-foreground">Rotation:</strong> Select a component, then click the **Orientation** button in the inspector to rotate it by $90^\circ$ steps.
              </li>
              <li>
                <strong className="text-foreground">Tone Synth:</strong> Hook a **Buzzer** to a pulsed out NE555 Timer or voltage source to hear real sound waves.
              </li>
              <li>
                <strong className="text-foreground">Potentiometer:</strong> Slide the Wiper in the inspector to change resistance dynamically.
              </li>
              <li>
                <strong className="text-foreground">Save Custom:</strong> Name and save custom configurations to load them later from local storage.
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}

function getWireStraightPath(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

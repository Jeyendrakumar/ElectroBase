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
  FileText,
  Activity,
  CheckCircle2,
  Info,
  ChevronRight,
  Share2
} from "lucide-react";
import Link from "next/link";

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
  | "ground";

interface ComponentInstance {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  label: string;
  value: number; // Volts for battery, Ohms for resistor, Frequency/Time for 555
  state: {
    toggled?: boolean; // switch state
    pressed?: boolean; // button state
    blown?: boolean; // LED blown state
    lit?: boolean; // LED light state
    outputHigh?: boolean; // Gate / 555 output state
    frequency?: number; // 555 blink rate
  };
  color?: string; // LED color (red, green, blue, yellow)
}

interface PinNode {
  componentId: string;
  pinId: string; // e.g. 'pos', 'neg', 'p1', 'p2', 'anode', 'cathode'
  label: string;
  x: number; // relative x position
  y: number; // relative y position
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
// Component Pin Schemas (Rel. Positions & Connections)
// ----------------------------------------------------

const PIN_SCHEMAS: Record<ComponentType, { pinId: string; label: string; x: number; y: number }[]> = {
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
  ]
};

// ----------------------------------------------------
// Resistor Color Bands Resolver
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
  
  const colorMap = [
    "black", "brown", "red", "orange", "yellow", 
    "green", "blue", "violet", "gray", "white"
  ];
  
  const band1 = colorMap[parseInt(digits[0])] || "black";
  const band2 = colorMap[parseInt(digits[1])] || "black";
  
  let band3 = "black";
  if (multiplier === -1) band3 = "gold";
  else if (multiplier === -2) band3 = "silver";
  else band3 = colorMap[multiplier] || "black";
  
  return [band1, band2, band3, "gold"];
}

// Color matching dictionary for styled border representation
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

  // Wire drawing states
  const [wireStart, setWireStart] = useState<{ componentId: string; pinId: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Canvas movement states
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<SVGSVGElement>(null);

  // Simulated node state cache
  const [netStates, setNetStates] = useState<Record<string, { voltage: number; isShortCircuit: boolean }>>({});

  // 555 state alternator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setTimeTick((prev) => prev + 1);
      }, 100); // 100ms ticks
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Add a message helper
  const addLog = (text: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setCircuitLogs((prev) => [
      { id: Math.random().toString(), timestamp, text, type },
      ...prev.slice(0, 19) // Keep last 20 logs
    ]);
  };

  // Log on simulation toggle
  useEffect(() => {
    if (isSimulating) {
      addLog("Circuit Simulation Started.", "success");
    } else {
      addLog("Circuit Simulation Stopped.", "info");
      // Turn off states
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
    }
  }, [isSimulating]);

  // ----------------------------------------------------
  // Electrical Network Solver (Simplified nodal analysis)
  // ----------------------------------------------------
  useEffect(() => {
    if (!isSimulating) {
      setNetStates({});
      return;
    }

    // Step 1: Map all terminal nodes to unique index names, e.g. "comp1_pin1"
    const pinIds: string[] = [];
    components.forEach((c) => {
      const pins = PIN_SCHEMAS[c.type] || [];
      pins.forEach((p) => {
        pinIds.push(`${c.id}_${p.pinId}`);
      });
    });

    // Step 2: Run Disjoint-Set / Connected Components to group pins connected by wires
    // Initialize parent mapping for Union-Find
    const parent: Record<string, string> = {};
    pinIds.forEach((p) => (parent[p] = p));

    function find(i: string): string {
      if (parent[i] === i) return i;
      parent[i] = find(parent[i]); // Path compression
      return parent[i];
    }

    function union(i: string, j: string) {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootI] = rootJ;
      }
    }

    // Merge pins connected directly via wires
    wires.forEach((w) => {
      const p1 = `${w.from.componentId}_${w.from.pinId}`;
      const p2 = `${w.to.componentId}_${w.to.pinId}`;
      if (parent[p1] && parent[p2]) {
        union(p1, p2);
      }
    });

    // Merge internal closed connections of switches/buttons
    components.forEach((c) => {
      if (c.type === "switch" && c.state.toggled) {
        union(`${c.id}_p1`, `${c.id}_p2`);
      }
      if (c.type === "button" && c.state.pressed) {
        union(`${c.id}_p1`, `${c.id}_p2`);
      }
    });

    // Group pins by their root net node
    const nets: Record<string, string[]> = {};
    pinIds.forEach((p) => {
      const root = find(p);
      if (!nets[root]) nets[root] = [];
      nets[root].push(p);
    });

    // Step 3: Solve voltages for each net
    const calculatedNets: Record<string, { voltage: number; isShortCircuit: boolean }> = {};
    
    // Find absolute positive and negative references
    const batteryPosRoots = new Set<string>();
    const batteryNegRoots = new Set<string>();
    const gndRoots = new Set<string>();

    // Map outputs of active logic gates / timers
    const activeHighRoots = new Set<string>();
    const activeLowRoots = new Set<string>();

    components.forEach((c) => {
      if (c.type === "battery") {
        const posRoot = find(`${c.id}_pos`);
        const negRoot = find(`${c.id}_neg`);
        batteryPosRoots.add(posRoot);
        batteryNegRoots.add(negRoot);
      }
      if (c.type === "ground") {
        gndRoots.add(find(`${c.id}_gnd`));
      }
      
      // 555 Timer Logic Output
      if (c.type === "timer555") {
        const vccRoot = find(`${c.id}_VCC`);
        const gndRoot = find(`${c.id}_GND`);
        
        // 555 timer runs if VCC connected to positive and GND to negative/gnd
        const isPowered = Array.from(batteryPosRoots).some(r => r === vccRoot) &&
                          (Array.from(batteryNegRoots).some(r => r === gndRoot) || Array.from(gndRoots).some(r => r === gndRoot));
                          
        if (isPowered) {
          // Toggle high/low based on current time tick & setting
          const stateHigh = Math.floor(timeTick / 3) % 2 === 0;
          const outRoot = find(`${c.id}_OUT`);
          if (stateHigh) {
            activeHighRoots.add(outRoot);
          } else {
            activeLowRoots.add(outRoot);
          }
        }
      }

      // Logic Gate Inputs/Outputs
      if (c.type === "gateNot") {
        const inRoot = find(`${c.id}_in`);
        const outRoot = find(`${c.id}_out`);
        
        // Evaluate input high (if connected to battery pos or active outputs)
        const isHigh = Array.from(batteryPosRoots).some(r => r === inRoot) || Array.from(activeHighRoots).some(r => r === inRoot);
        if (!isHigh) {
          activeHighRoots.add(outRoot); // NOT input Low yields High
        } else {
          activeLowRoots.add(outRoot); // NOT input High yields Low
        }
      }

      if (c.type === "gateAnd" || c.type === "gateOr") {
        const in1Root = find(`${c.id}_in1`);
        const in2Root = find(`${c.id}_in2`);
        const outRoot = find(`${c.id}_out`);

        const is1High = Array.from(batteryPosRoots).some(r => r === in1Root) || Array.from(activeHighRoots).some(r => r === in1Root);
        const is2High = Array.from(batteryPosRoots).some(r => r === in2Root) || Array.from(activeHighRoots).some(r => r === in2Root);

        const outHigh = c.type === "gateAnd" ? (is1High && is2High) : (is1High || is2High);
        if (outHigh) {
          activeHighRoots.add(outRoot);
        } else {
          activeLowRoots.add(outRoot);
        }
      }
    });

    // Determine short circuit if positive merges with negative/GND
    let shortCircuitDetected = false;
    batteryPosRoots.forEach((pos) => {
      if (batteryNegRoots.has(pos) || gndRoots.has(pos) || activeLowRoots.has(pos)) {
        shortCircuitDetected = true;
      }
    });

    // Assign voltages to nets
    Object.keys(nets).forEach((netRoot) => {
      let v = 0;
      if (batteryPosRoots.has(netRoot) || activeHighRoots.has(netRoot)) {
        // Find maximum battery voltage connected to this net
        const batteriesConnected = components.filter(c => c.type === "battery" && find(`${c.id}_pos`) === netRoot);
        const maxV = batteriesConnected.length > 0 ? Math.max(...batteriesConnected.map(b => b.value)) : 5;
        v = maxV;
      } else if (batteryNegRoots.has(netRoot) || gndRoots.has(netRoot) || activeLowRoots.has(netRoot)) {
        v = 0;
      } else {
        // Floating node or resistor divider - check connection paths
        // Simplify: if a path exists from positive through elements
        const hasPosPath = Array.from(batteryPosRoots).some(p => p === netRoot) || Array.from(activeHighRoots).some(p => p === netRoot);
        v = hasPosPath ? 5 : 0; // standard logic logic
      }

      calculatedNets[netRoot] = {
        voltage: v,
        isShortCircuit: shortCircuitDetected
      };
    });

    // Store calculated potentials
    setNetStates(calculatedNets);

    // Step 4: Update LED states based on solved network states
    let ledOverload = false;
    let anyLEDLit = false;

    setComponents((prev) =>
      prev.map((c) => {
        if (c.type !== "led") return c;

        const anodeRoot = find(`${c.id}_anode`);
        const cathodeRoot = find(`${c.id}_cathode`);

        const anodeState = calculatedNets[anodeRoot] || { voltage: 0, isShortCircuit: false };
        const cathodeState = calculatedNets[cathodeRoot] || { voltage: 0, isShortCircuit: false };

        const deltaV = anodeState.voltage - cathodeState.voltage;
        const forwardBiased = deltaV > 1.8; // red LED turn on voltage

        if (c.state.blown) return c; // keep blown if already blown

        let lit = false;
        let blown = false;

        if (forwardBiased && !shortCircuitDetected) {
          // Check for resistor in path to prevent blowing LED
          // Simple verification: trace if the anode net is connected directly to a high voltage source without resistors.
          // In a simple circuit, does the positive net connect directly to the LED's anode root?
          const isDirectHigh = Array.from(batteryPosRoots).some(r => r === anodeRoot);
          const batteriesHigh = components.filter(comp => comp.type === "battery" && find(`${comp.id}_pos`) === anodeRoot);
          const highestBatteryDirect = batteriesHigh.length > 0 ? Math.max(...batteriesHigh.map(b => b.value)) : 0;
          
          if (isDirectHigh && highestBatteryDirect > 3.0) {
            // Blow LED if direct battery connection > 3.0V
            blown = true;
            ledOverload = true;
          } else {
            lit = true;
            anyLEDLit = true;
          }
        }

        return {
          ...c,
          state: {
            ...c.state,
            lit,
            blown: blown || c.state.blown
          }
        };
      })
    );

    if (shortCircuitDetected) {
      addLog("⚠️ SHORT CIRCUIT DETECTED! Shutting down path flows.", "error");
    }
    if (ledOverload) {
      addLog("💥 LED BLOWN OUT! 9V direct power exceeded maximum 20mA forward current. Add a series resistor!", "error");
    }

  }, [isSimulating, wires, components, timeTick]);

  // ----------------------------------------------------
  // Component Toolbox & Template actions
  // ----------------------------------------------------

  const spawnComponent = (type: ComponentType, label: string, value = 0, color = "red") => {
    const newComp: ComponentInstance = {
      id: `${type}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: 300 + (components.length * 15) % 100, // Cascade spawns near center
      y: 200 + (components.length * 15) % 100,
      label,
      value,
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
    if (selectedId === id) setSelectedId(null);
    if (wireStart?.componentId === id) setWireStart(null);
    addLog("Deleted component from workspace.", "info");
  };

  const loadTemplate = (templateName: "simpleLed" | "logicAnd" | "blinker555") => {
    setIsSimulating(false);
    setSelectedId(null);
    setWireStart(null);
    
    if (templateName === "simpleLed") {
      const batId = "bat_1";
      const swId = "sw_1";
      const resId = "res_1";
      const ledId = "led_1";

      const templateComps: ComponentInstance[] = [
        { id: batId, type: "battery", x: 100, y: 160, label: "9V Battery", value: 9, state: {} },
        { id: swId, type: "switch", x: 260, y: 120, label: "Power Switch", value: 0, state: { toggled: true } },
        { id: resId, type: "resistor", x: 420, y: 140, label: "330 Ohm Resistor", value: 330, state: {} },
        { id: ledId, type: "led", x: 580, y: 190, label: "Red LED", value: 0, state: { lit: false, blown: false }, color: "red" },
        { id: "gnd_1", type: "ground", x: 260, y: 340, label: "Circuit GND", value: 0, state: {} }
      ];

      const templateWires: WireConnection[] = [
        // Battery Pos -> Switch Pin 1
        { id: "w1", from: { componentId: batId, pinId: "pos" }, to: { componentId: swId, pinId: "p1" } },
        // Switch Pin 2 -> Resistor Pin 1
        { id: "w2", from: { componentId: swId, pinId: "p2" }, to: { componentId: resId, pinId: "p1" } },
        // Resistor Pin 2 -> LED Anode
        { id: "w3", from: { componentId: resId, pinId: "p2" }, to: { componentId: ledId, pinId: "anode" } },
        // LED Cathode -> GND
        { id: "w4", from: { componentId: ledId, pinId: "cathode" }, to: { componentId: "gnd_1", pinId: "gnd" } },
        // Battery Neg -> GND
        { id: "w5", from: { componentId: batId, pinId: "neg" }, to: { componentId: "gnd_1", pinId: "gnd" } }
      ];

      setComponents(templateComps);
      setWires(templateWires);
      addLog("Loaded Simple LED Circuit template.", "success");
    } else if (templateName === "logicAnd") {
      const batId = "bat_1";
      const sw1Id = "sw_1";
      const sw2Id = "sw_2";
      const andId = "and_1";
      const ledId = "led_1";

      const templateComps: ComponentInstance[] = [
        { id: batId, type: "battery", x: 80, y: 180, label: "5V Source", value: 5, state: {} },
        { id: sw1Id, type: "switch", x: 240, y: 100, label: "Input A", value: 0, state: { toggled: true } },
        { id: sw2Id, type: "switch", x: 240, y: 220, label: "Input B", value: 0, state: { toggled: false } },
        { id: andId, type: "gateAnd", x: 420, y: 160, label: "AND Gate", value: 0, state: {} },
        { id: ledId, type: "led", x: 600, y: 200, label: "Logic Output LED", value: 0, state: {}, color: "green" },
        { id: "gnd_1", type: "ground", x: 420, y: 340, label: "GND", value: 0, state: {} }
      ];

      const templateWires: WireConnection[] = [
        { id: "w1", from: { componentId: batId, pinId: "pos" }, to: { componentId: sw1Id, pinId: "p1" } },
        { id: "w2", from: { componentId: batId, pinId: "pos" }, to: { componentId: sw2Id, pinId: "p1" } },
        { id: "w3", from: { componentId: sw1Id, pinId: "p2" }, to: { componentId: andId, pinId: "in1" } },
        { id: "w4", from: { componentId: sw2Id, pinId: "p2" }, to: { componentId: andId, pinId: "in2" } },
        { id: "w5", from: { componentId: andId, pinId: "out" }, to: { componentId: ledId, pinId: "anode" } },
        { id: "w6", from: { componentId: ledId, pinId: "cathode" }, to: { componentId: "gnd_1", pinId: "gnd" } },
        { id: "w7", from: { componentId: batId, pinId: "neg" }, to: { componentId: "gnd_1", pinId: "gnd" } }
      ];

      setComponents(templateComps);
      setWires(templateWires);
      addLog("Loaded Logic Gate AND Demo template.", "success");
    } else if (templateName === "blinker555") {
      const batId = "bat_1";
      const timerId = "555_1";
      const ledId = "led_1";

      const templateComps: ComponentInstance[] = [
        { id: batId, type: "battery", x: 100, y: 200, label: "9V DC Supply", value: 9, state: {} },
        { id: timerId, type: "timer555", x: 300, y: 160, label: "NE555 Timer", value: 0, state: {} },
        { id: ledId, type: "led", x: 540, y: 220, label: "Output LED", value: 0, state: {}, color: "yellow" },
        { id: "gnd_1", type: "ground", x: 320, y: 380, label: "GND Node", value: 0, state: {} }
      ];

      const templateWires: WireConnection[] = [
        // Power VCC (Pin 8) & RESET (Pin 4) to Battery Positive
        { id: "w1", from: { componentId: batId, pinId: "pos" }, to: { componentId: timerId, pinId: "VCC" } },
        { id: "w2", from: { componentId: timerId, pinId: "VCC" }, to: { componentId: timerId, pinId: "RESET" } },
        
        // Connect GND (Pin 1) to GND
        { id: "w3", from: { componentId: timerId, pinId: "GND" }, to: { componentId: "gnd_1", pinId: "gnd" } },
        { id: "w4", from: { componentId: batId, pinId: "neg" }, to: { componentId: "gnd_1", pinId: "gnd" } },

        // Connect Out (Pin 3) to LED Anode
        { id: "w5", from: { componentId: timerId, pinId: "OUT" }, to: { componentId: ledId, pinId: "anode" } },
        // LED Cathode to GND
        { id: "w6", from: { componentId: ledId, pinId: "cathode" }, to: { componentId: "gnd_1", pinId: "gnd" } }
      ];

      setComponents(templateComps);
      setWires(templateWires);
      addLog("Loaded 555 Astable Blinker template.", "success");
    }
  };

  const clearWorkspace = () => {
    setIsSimulating(false);
    setComponents([]);
    setWires([]);
    setSelectedId(null);
    setWireStart(null);
    addLog("Workspace cleared.", "info");
  };

  // ----------------------------------------------------
  // Canvas Mouse & Drag Mechanics
  // ----------------------------------------------------

  const snap = (coord: number) => {
    return Math.round(coord / 20) * 20;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update mouse position for wire rubberband
    setMousePos({ x, y });

    // Handle dragging component
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

  const handleCanvasMouseUp = () => {
    setDraggingCompId(null);
  };

  // Click handler to draw wires
  const handlePinClick = (e: React.MouseEvent, componentId: string, pinId: string) => {
    e.stopPropagation();
    
    if (!wireStart) {
      // Start drawing wire
      setWireStart({ componentId, pinId });
      addLog(`Connecting wire from ${componentId} pin [${pinId}]...`, "info");
    } else {
      // Complete drawing wire
      if (wireStart.componentId === componentId) {
        // Can't connect to same component
        setWireStart(null);
        addLog("Cannot connect wire pins on same component.", "warning");
        return;
      }

      // Check if wire already exists
      const wireExists = wires.some(
        (w) =>
          (w.from.componentId === wireStart.componentId &&
            w.from.pinId === wireStart.pinId &&
            w.to.componentId === componentId &&
            w.to.pinId === pinId) ||
          (w.from.componentId === componentId &&
            w.from.pinId === pinId &&
            w.to.componentId === wireStart.componentId &&
            w.to.pinId === wireStart.pinId)
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
      addLog("Wire connected successfully.", "success");
    }
  };

  const deleteWire = (id: string) => {
    setWires((prev) => prev.filter((w) => w.id !== id));
    addLog("Deleted wire connection.", "info");
  };

  // Cancel current rubberband wire
  const handleCanvasClick = () => {
    if (wireStart) {
      setWireStart(null);
      addLog("Wire drawing cancelled.", "info");
    }
    setSelectedId(null);
  };

  // Toggle switch/button states manually on the canvas
  const handleComponentInteraction = (e: React.MouseEvent, comp: ComponentInstance) => {
    e.stopPropagation();
    if (comp.type === "switch") {
      setComponents((prev) =>
        prev.map((c) => {
          if (c.id !== comp.id) return c;
          const nextState = !c.state.toggled;
          addLog(`Switch [${c.label}] toggled ${nextState ? "ON" : "OFF"}.`, "info");
          return {
            ...c,
            state: { ...c.state, toggled: nextState }
          };
        })
      );
    }
  };

  const handleButtonPress = (comp: ComponentInstance, pressed: boolean) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== comp.id) return c;
        return {
          ...c,
          state: { ...c.state, pressed }
        };
      })
    );
  };

  // ----------------------------------------------------
  // Helper for drawing wires nicely
  // ----------------------------------------------------
  const getPinCanvasCoords = (compId: string, pinId: string) => {
    const comp = components.find((c) => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    const schema = PIN_SCHEMAS[comp.type] || [];
    const pin = schema.find((p) => p.pinId === pinId);
    if (!pin) return { x: 0, y: 0 };
    return {
      x: comp.x + pin.x,
      y: comp.y + pin.y
    };
  };

  // Render SVG Bezier curve
  const getWireCurvePath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x1 - x2);
    // Draw classic smooth schematic Bezier line routing
    return `M ${x1} ${y1} C ${x1 + dx * 0.5} y1, ${x2 - dx * 0.5} y2, ${x2} ${y2}`;
  };

  const getWireStraightPath = (x1: number, y1: number, x2: number, y2: number) => {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  };

  // Selected item inspector values update
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
    addLog("Repaired blown LEDs in workspace.", "success");
  };

  const selectedComp = components.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      {/* CSS Flow Animation for Active Wires */}
      <style>{`
        @keyframes flowAnim {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-flow-dash {
          animation: flowAnim 0.7s linear infinite;
        }
      `}</style>

      {/* Header and navigation bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400">
            <Zap size={12} />
            <span>SANDBOX WORKSPACE</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Circuit Simulator</h1>
          <p className="text-muted-foreground text-sm">
            Drag, place, and wire components on the schematic grid. Toggle "Run Simulation" to check logic paths, Blinking 555 oscillators, and electron currents.
          </p>
        </div>
        <div className="flex gap-2">
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
                <span>Stop Sim</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" className="animate-pulse" />
                <span>Run Sim</span>
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

      {/* Pre-built circuit templates dropdown */}
      <div className="rounded-xl glass border border-border/40 p-4 flex flex-wrap items-center gap-4">
        <div className="text-sm font-mono text-cyan-400 flex items-center gap-2">
          <Cpu size={16} />
          <span>Preset Circuits:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadTemplate("simpleLed")}
            className="px-3 py-1.5 rounded-lg border border-border bg-neutral-900/60 text-xs hover:border-cyan-500/40 text-foreground transition-colors"
          >
            💡 Simple LED Loop (9V)
          </button>
          <button
            onClick={() => loadTemplate("logicAnd")}
            className="px-3 py-1.5 rounded-lg border border-border bg-neutral-900/60 text-xs hover:border-cyan-500/40 text-foreground transition-colors"
          >
            🔀 Logic AND Gate Demo
          </button>
          <button
            onClick={() => loadTemplate("blinker555")}
            className="px-3 py-1.5 rounded-lg border border-border bg-neutral-900/60 text-xs hover:border-cyan-500/40 text-foreground transition-colors"
          >
            ⏱️ NE555 Astable Blinker
          </button>
          <button
            onClick={resetLEDs}
            className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-950/20 text-xs text-red-400 hover:bg-red-950/40 transition-colors ml-auto"
          >
            🔧 Repair Blown LEDs
          </button>
        </div>
      </div>

      {/* Main Grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left components menu: col span 3 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl glass border border-border/40 p-4 space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Components Toolbox
            </h3>
            
            <div className="grid grid-cols-1 gap-2 text-left">
              {/* Battery */}
              <button
                onClick={() => spawnComponent("battery", "Battery", 9)}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
              >
                <div className="p-2 rounded bg-neutral-800 text-amber-400 group-hover:bg-cyan-500/10">
                  <Zap size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Battery (DC)</div>
                  <div className="text-[10px] text-muted-foreground">Adjustable voltage source</div>
                </div>
              </button>

              {/* Resistor */}
              <button
                onClick={() => spawnComponent("resistor", "Resistor", 330)}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
              >
                <div className="p-2 rounded bg-neutral-800 text-yellow-500 group-hover:bg-cyan-500/10">
                  <span className="font-bold text-xs tracking-tight">Ω</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Resistor</div>
                  <div className="text-[10px] text-muted-foreground">Limits current flows</div>
                </div>
              </button>

              {/* LED */}
              <button
                onClick={() => spawnComponent("led", "LED", 0, "red")}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
              >
                <div className="p-2 rounded bg-neutral-800 text-red-500 group-hover:bg-cyan-500/10">
                  <Zap size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">LED</div>
                  <div className="text-[10px] text-muted-foreground">Glows if current passes</div>
                </div>
              </button>

              {/* Switch */}
              <button
                onClick={() => spawnComponent("switch", "Toggle Switch")}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
              >
                <div className="p-2 rounded bg-neutral-800 text-blue-400 group-hover:bg-cyan-500/10">
                  <span className="font-bold text-xs">/ _</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">SPST Switch</div>
                  <div className="text-[10px] text-muted-foreground">Toggles connection state</div>
                </div>
              </button>

              {/* Push Button */}
              <button
                onMouseDown={() => spawnComponent("button", "Push Button")}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
              >
                <div className="p-2 rounded bg-neutral-800 text-emerald-400 group-hover:bg-cyan-500/10">
                  <span className="font-bold text-xs">○</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Push Button</div>
                  <div className="text-[10px] text-muted-foreground">Active while clicked</div>
                </div>
              </button>

              {/* 555 Timer */}
              <button
                onClick={() => spawnComponent("timer555", "NE555 Timer")}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
              >
                <div className="p-2 rounded bg-neutral-800 text-violet-400 group-hover:bg-cyan-500/10">
                  <span className="font-bold text-xs font-mono">555</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">NE555 IC</div>
                  <div className="text-[10px] text-muted-foreground">Square wave generator</div>
                </div>
              </button>

              {/* NOT Gate */}
              <button
                onClick={() => spawnComponent("gateNot", "NOT Gate")}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
              >
                <div className="p-2 rounded bg-neutral-800 text-pink-400 group-hover:bg-cyan-500/10">
                  <span className="font-bold text-xs">▷o</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Logic NOT</div>
                  <div className="text-[10px] text-muted-foreground">Inverts logic signal</div>
                </div>
              </button>

              {/* AND Gate */}
              <button
                onClick={() => spawnComponent("gateAnd", "AND Gate")}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
              >
                <div className="p-2 rounded bg-neutral-800 text-indigo-400 group-hover:bg-cyan-500/10">
                  <span className="font-bold text-xs">D-</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Logic AND</div>
                  <div className="text-[10px] text-muted-foreground">Requires both inputs High</div>
                </div>
              </button>

              {/* OR Gate */}
              <button
                onClick={() => spawnComponent("gateOr", "OR Gate")}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
              >
                <div className="p-2 rounded bg-neutral-800 text-sky-400 group-hover:bg-cyan-500/10">
                  <span className="font-bold text-xs">)-</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Logic OR</div>
                  <div className="text-[10px] text-muted-foreground">Requires either input High</div>
                </div>
              </button>

              {/* Ground */}
              <button
                onClick={() => spawnComponent("ground", "GND reference")}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-card/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
              >
                <div className="p-2 rounded bg-neutral-800 text-neutral-400 group-hover:bg-cyan-500/10">
                  <span className="font-bold text-xs">⏚</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Ground (0V)</div>
                  <div className="text-[10px] text-muted-foreground">Reference return point</div>
                </div>
              </button>

            </div>
          </div>
        </div>

        {/* Center Canvas Workspace: col span 6 */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="rounded-xl glass border border-border/40 p-1 bg-neutral-950 overflow-hidden relative select-none">
            
            {/* Canvas overlay labels */}
            <div className="absolute top-3 left-3 text-[10px] font-mono text-muted-foreground bg-black/60 px-2 py-1 rounded border border-border/40 pointer-events-none z-10">
              Grid Snap: 20px | {wireStart ? "Mode: Connecting Wires" : "Mode: Placing Components"}
            </div>

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
              {/* DRAW CONNECTIONS (Wires) */}
              {wires.map((wire) => {
                const start = getPinCanvasCoords(wire.from.componentId, wire.from.pinId);
                const end = getPinCanvasCoords(wire.to.componentId, wire.to.pinId);
                
                const rootNet = Object.keys(netStates).find((root) => {
                  const pId = `${wire.from.componentId}_${wire.from.pinId}`;
                  // Net groups contain this pin
                  return pId.includes(root) || root.includes(pId);
                });

                const state = rootNet ? netStates[rootNet] : null;
                const isShort = state?.isShortCircuit || false;
                const voltage = state?.voltage || 0;

                // Set wire color based on active simulation state
                let wireColor = "#525252"; // neutral gray
                let hasCurrent = false;

                if (isSimulating) {
                  if (isShort) {
                    wireColor = "#ef4444"; // Flashing short circuit red
                  } else if (voltage > 3.0) {
                    wireColor = "#22c55e"; // Active positive (neon green)
                    hasCurrent = true;
                  } else if (voltage > 0) {
                    wireColor = "#eab308"; // Lower positive (yellow)
                    hasCurrent = true;
                  } else {
                    wireColor = "#06b6d4"; // Active GND return (neon cyan)
                    hasCurrent = true;
                  }
                }

                const pathData = getWireStraightPath(start.x, start.y, end.x, end.y);

                return (
                  <g key={wire.id} className="group">
                    {/* Hover clickable border path */}
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
                    
                    {/* Visual wire path */}
                    <path
                      d={pathData}
                      stroke={wireColor}
                      strokeWidth="3.5"
                      fill="none"
                      className="transition-all duration-300 pointer-events-none"
                    />

                    {/* Electron particle animation (dashoffset shift) */}
                    {isSimulating && hasCurrent && !isShort && (
                      <path
                        d={pathData}
                        stroke={voltage > 2 ? "#a3e635" : "#22d3ee"} // bright green or cyan
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="6, 14"
                        className="animate-flow-dash pointer-events-none"
                      />
                    )}

                    {/* Trashcan button for wire deletion */}
                    <title>Click wire to delete</title>
                  </g>
                );
              })}

              {/* Rubberband Wire Drawing Mode */}
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

                // Color themes for component outlines
                let borderStroke = isSelected ? "#06b6d4" : "#404040";
                let fillBg = "#171717";

                return (
                  <g
                    key={comp.id}
                    transform={`translate(${comp.x}, ${comp.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(comp.id);
                    }}
                    onMouseDown={(e) => handleComponentStartDrag(comp.id, e, comp.x, comp.y)}
                    className="cursor-move select-none"
                  >
                    {/* Component Card box border */}
                    <rect
                      x="0"
                      y="0"
                      width={comp.type === "timer555" ? 100 : comp.type === "ground" ? 60 : 80}
                      height={
                        comp.type === "battery"
                          ? 80
                          : comp.type === "timer555"
                          ? 120
                          : comp.type === "gateAnd" || comp.type === "gateOr"
                          ? 80
                          : comp.type === "led"
                          ? 60
                          : 40
                      }
                      rx="6"
                      fill={fillBg}
                      stroke={borderStroke}
                      strokeWidth={isSelected ? 2 : 1.5}
                      className="transition-all hover:stroke-cyan-500/40"
                    />

                    {/* Component specific internal graphics */}
                    {comp.type === "battery" && (
                      <g transform="translate(15, 20)">
                        {/* Battery cell symbols */}
                        <line x1="10" y1="15" x2="40" y2="15" stroke="#f59e0b" strokeWidth="3" />
                        <line x1="20" y1="23" x2="30" y2="23" stroke="#f59e0b" strokeWidth="2.5" />
                        <line x1="10" y1="31" x2="40" y2="31" stroke="#f59e0b" strokeWidth="3" />
                        <line x1="20" y1="39" x2="30" y2="39" stroke="#f59e0b" strokeWidth="2.5" />
                        <text x="25" y="8" fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold">
                          {comp.value}V
                        </text>
                      </g>
                    )}

                    {comp.type === "resistor" && (
                      <g transform="translate(20, 10)">
                        {/* Resistor zig-zag */}
                        <rect x="0" y="5" width="40" height="10" rx="3" fill="#262626" stroke="#d97706" />
                        {/* Color bands based on value */}
                        {(() => {
                          const bands = getResistorBands(comp.value);
                          return (
                            <g>
                              <rect x="8" y="5.5" width="3.5" height="9" fill={bands[0]} />
                              <rect x="16" y="5.5" width="3.5" height="9" fill={bands[1]} />
                              <rect x="24" y="5.5" width="3.5" height="9" fill={bands[2]} />
                              <rect x="32" y="5.5" width="3.5" height="9" fill={bands[3]} />
                            </g>
                          );
                        })()}
                        <text x="20" y="-2" fill="#d97706" fontSize="8" textAnchor="middle" className="font-mono">
                          {comp.value >= 1000 ? `${(comp.value/1000).toFixed(1)}k` : comp.value}Ω
                        </text>
                      </g>
                    )}

                    {comp.type === "led" && (
                      <g transform="translate(20, 10)">
                        {/* LED symbol */}
                        {comp.state.blown ? (
                          // Blown up cross
                          <g stroke="#ef4444" strokeWidth="2">
                            <line x1="5" y1="5" x2="35" y2="35" />
                            <line x1="35" y1="5" x2="5" y2="35" />
                            <text x="20" y="25" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">
                              BLOWN
                            </text>
                          </g>
                        ) : (
                          // Diode arrow
                          <g>
                            <polygon points="12,10 12,30 28,20" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                            <line x1="28" y1="10" x2="28" y2="30" stroke="#e5e7eb" strokeWidth="2" />
                            {/* Two small light emitting arrows */}
                            <line x1="22" y1="8" x2="16" y2="2" stroke="#e5e7eb" strokeWidth="1" />
                            <polygon points="16,2 19,4 17,5" fill="#e5e7eb" />
                            <line x1="28" y1="8" x2="22" y2="2" stroke="#e5e7eb" strokeWidth="1" />
                            <polygon points="22,2 25,4 23,5" fill="#e5e7eb" />
                            
                            {/* Glowing diode bulb representation */}
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

                    {comp.type === "switch" && (
                      <g transform="translate(15, 10)" onClick={(e) => handleComponentInteraction(e, comp)}>
                        {/* Pivoted switch line */}
                        <circle cx="10" y="10" r="3" fill="#60a5fa" />
                        <circle cx="50" y="10" r="3" fill="#60a5fa" />
                        {comp.state.toggled ? (
                          // closed
                          <line x1="10" y1="10" x2="50" y2="10" stroke="#60a5fa" strokeWidth="3" />
                        ) : (
                          // open angled up
                          <line x1="10" y1="10" x2="45" y2="-5" stroke="#60a5fa" strokeWidth="3" />
                        )}
                        <text x="30" y="24" fill="#60a5fa" fontSize="8" textAnchor="middle">
                          {comp.state.toggled ? "CLOSED" : "OPEN"}
                        </text>
                      </g>
                    )}

                    {comp.type === "button" && (
                      <g
                        transform="translate(15, 10)"
                        onMouseDown={() => handleButtonPress(comp, true)}
                        onMouseUp={() => handleButtonPress(comp, false)}
                        onMouseLeave={() => handleButtonPress(comp, false)}
                      >
                        {/* Push button layout */}
                        <circle cx="10" y="10" r="2.5" fill="#10b981" />
                        <circle cx="50" y="10" r="2.5" fill="#10b981" />
                        {/* Plunger */}
                        <line x1="20" y1="10" x2="40" y2="10" stroke="#10b981" strokeWidth="2.5" />
                        {comp.state.pressed ? (
                          // pressed down
                          <line x1="30" y1="10" x2="30" y2="7" stroke="#10b981" strokeWidth="2.5" />
                        ) : (
                          // popped up
                          <line x1="30" y1="10" x2="30" y2="4" stroke="#10b981" strokeWidth="2.5" />
                        )}
                        <rect x="22" y="1.5" width="16" height="3" fill="#10b981" />
                      </g>
                    )}

                    {comp.type === "timer555" && (
                      <g transform="translate(15, 15)">
                        <rect x="0" y="0" width="70" height="90" rx="3" fill="#171717" stroke="#8b5cf6" strokeWidth="1" />
                        <text x="35" y="45" fill="#8b5cf6" fontSize="12" fontWeight="bold" textAnchor="middle" className="font-mono">
                          NE555
                        </text>
                        {/* Small package orientation dot */}
                        <circle cx="12" cy="12" r="3" fill="#8b5cf6" opacity="0.6" />
                      </g>
                    )}

                    {comp.type === "gateNot" && (
                      <g transform="translate(15, 5)">
                        {/* NOT triangle */}
                        <polygon points="15,10 15,30 35,20" fill="none" stroke="#f472b6" strokeWidth="2" />
                        <circle cx="38" cy="20" r="3" fill="none" stroke="#f472b6" strokeWidth="2" />
                      </g>
                    )}

                    {comp.type === "gateAnd" && (
                      <g transform="translate(15, 10)">
                        {/* AND shape */}
                        <path d="M 15 10 L 30 10 A 15 15 0 0 1 30 40 L 15 40 Z" fill="none" stroke="#6366f1" strokeWidth="2" />
                        <text x="25" y="30" fill="#6366f1" fontSize="9" fontWeight="bold">AND</text>
                      </g>
                    )}

                    {comp.type === "gateOr" && (
                      <g transform="translate(15, 10)">
                        {/* OR shape */}
                        <path d="M 15 10 C 20 20, 20 30, 15 40 C 25 40, 35 35, 45 25 C 35 15, 25 10, 15 10" fill="none" stroke="#38bdf8" strokeWidth="2" />
                        <text x="22" y="29" fill="#38bdf8" fontSize="9" fontWeight="bold">OR</text>
                      </g>
                    )}

                    {comp.type === "ground" && (
                      <g transform="translate(10, 10)">
                        {/* GND lines */}
                        <line x1="20" y1="5" x2="20" y2="20" stroke="#a3a3a3" strokeWidth="2" />
                        <line x1="5" y1="20" x2="35" y2="20" stroke="#a3a3a3" strokeWidth="3" />
                        <line x1="10" y1="26" x2="30" y2="26" stroke="#a3a3a3" strokeWidth="2.5" />
                        <line x1="15" y1="32" x2="25" y2="32" stroke="#a3a3a3" strokeWidth="1.5" />
                      </g>
                    )}

                    {/* Component Label Text */}
                    <text
                      x={comp.type === "timer555" ? 50 : comp.type === "ground" ? 30 : 40}
                      y={
                        comp.type === "battery"
                          ? 95
                          : comp.type === "timer555"
                          ? 135
                          : comp.type === "gateAnd" || comp.type === "gateOr"
                          ? 95
                          : comp.type === "led"
                          ? 75
                          : 55
                      }
                      fill={isSelected ? "#22d3ee" : "#a3a3a3"}
                      fontSize="9.5"
                      fontWeight={isSelected ? "bold" : "normal"}
                      textAnchor="middle"
                      className="font-sans pointer-events-none"
                    >
                      {comp.label}
                    </text>

                    {/* DRAW TERMINAL PINS (Nodes to wire) */}
                    {schema.map((pin) => {
                      const isConnectingStart =
                        wireStart &&
                        wireStart.componentId === comp.id &&
                        wireStart.pinId === pin.pinId;

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
                          onMouseDown={(e) => e.stopPropagation()} // Stop dragging comp when clicking node
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

          {/* Console Output logs: bottom span */}
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
                  No logs available. Deploy components and toggle "Run Sim" to begin.
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

        {/* Right side parameters panel / inspector: col span 3 */}
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
                    {selectedComp.type} Reference
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {selectedComp.label}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-1">
                    ID: {selectedComp.id}
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
                    <p className="text-[10px] text-neutral-500">
                      Varies DC output voltage from 1.5V (AA cell) up to 24V industrial supply rails.
                    </p>
                  </div>
                )}

                {/* Resistor ohm slider */}
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
                    <div className="flex gap-1 pt-1.5 justify-start">
                      {getResistorBands(selectedComp.value).map((band, idx) => (
                        <span
                          key={idx}
                          className={`w-4 h-4 rounded-full border text-[8px] flex items-center justify-center font-semibold capitalize ${BAND_COLOR_CLASSES[band]}`}
                          title={`${band} band`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Alters resistance limiting output. 330Ω–1kΩ are recommended values to protect LEDs under 9V power.
                    </p>
                  </div>
                )}

                {/* LED color selection */}
                {selectedComp.type === "led" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">LED Color</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Red", value: "red", colorClass: "bg-red-500" },
                        { label: "Green", value: "green", colorClass: "bg-green-500" },
                        { label: "Blue", value: "blue", colorClass: "bg-blue-500" },
                        { label: "Yellow", value: "yellow", colorClass: "bg-yellow-500" }
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => updateSelectedColor(item.value)}
                          className={`p-2.5 rounded-lg border text-[10px] text-center font-medium capitalize transition-colors ${
                            selectedComp.color === item.value
                              ? "border-cyan-500 text-foreground bg-neutral-800"
                              : "border-border/60 text-muted-foreground hover:border-cyan-500/20"
                          }`}
                        >
                          <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1 ${item.colorClass}`} />
                        </button>
                      ))}
                    </div>
                    {selectedComp.state.blown && (
                      <div className="flex items-center gap-1.5 p-2 rounded bg-red-950/20 border border-red-500/20 text-red-400 text-[10px]">
                        <AlertTriangle size={14} />
                        <span>This LED is burned out. Click "Repair Blown LEDs" above to replace it.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Switch info */}
                {selectedComp.type === "switch" && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Click the switch on the grid workspace to open or close the contacts.
                    </p>
                    <p className="font-mono text-cyan-400 text-[10px] mt-2">
                      State: {selectedComp.state.toggled ? "Closed (Conducting)" : "Open (Disconnected)"}
                    </p>
                  </div>
                )}

                {/* Button info */}
                {selectedComp.type === "button" && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Press and hold the button directly on the canvas to close the contacts.
                    </p>
                    <p className="font-mono text-cyan-400 text-[10px] mt-2">
                      State: {selectedComp.state.pressed ? "Pressed (Active)" : "Released (Inactive)"}
                    </p>
                  </div>
                )}

                {/* 555 pulse settings */}
                {selectedComp.type === "timer555" && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Generates astable pulses when connected to VCC and GND.
                    </p>
                    <p className="font-mono text-cyan-400 text-[10px] mt-2">
                      Blinking status: {selectedComp.state.outputHigh ? "Pulse High (+V)" : "Pulse Low (0V)"}
                    </p>
                  </div>
                )}

                {/* Action button to delete selected component */}
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
                No component selected. Select an item in the workspace to view and edit its parameters.
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
                <strong className="text-foreground">Wiring:</strong> Click a pin node (small circle) on one component, then click another pin on a different component to connect them with a wire.
              </li>
              <li>
                <strong className="text-foreground">Wire Removal:</strong> Hover over any wire and click it on the grid to delete it.
              </li>
              <li>
                <strong className="text-foreground">Component Movement:</strong> Click and drag components to snap and align them on the 20px grid layout.
              </li>
              <li>
                <strong className="text-foreground">Simulate:</strong> Click the green "Run Sim" button to start calculations. Hover wire paths to check state voltages.
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}

import {
  Cpu,
  Minus,
  Battery,
  Zap,
  GitBranch,
  Thermometer,
  Plug,
  ToggleRight,
  Radio,
  type LucideIcon,
  Microchip,
  Cog,
  BatteryCharging,
  Gauge,
  Wifi,
  Monitor,
  CircleDot,
} from "lucide-react";

export const APP_NAME = "ElectroBase";
export const APP_DESCRIPTION =
  "The all-in-one electronics component reference library for engineers, makers, and hardware professionals. Datasheets, pinouts, specs & footprints.";
export const ITEMS_PER_PAGE = 12;

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  IC: Cpu,
  Resistor: Minus,
  Capacitor: Battery,
  Diode: Zap,
  Transistor: GitBranch,
  Sensor: Thermometer,
  Microcontroller: Microchip,
  Connector: Plug,
  Relay: ToggleRight,
  "Crystal Oscillator": Radio,
  "Motor Driver": Cog,
  "Power Module": BatteryCharging,
  "Voltage Reference": Gauge,
  "Communication Module": Wifi,
  "Display Module": Monitor,
  Inductor: CircleDot,
};

export const CATEGORY_COLORS: Record<string, string> = {
  IC: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Resistor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Capacitor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Diode: "bg-red-500/20 text-red-400 border-red-500/30",
  Transistor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Sensor: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  Microcontroller: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Connector: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Relay: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Crystal Oscillator": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Motor Driver": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "Power Module": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Voltage Reference": "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "Communication Module": "bg-green-500/20 text-green-400 border-green-500/30",
  "Display Module": "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
  Inductor: "bg-lime-500/20 text-lime-400 border-lime-500/30",
};

export const CATEGORY_GRADIENT: Record<string, string> = {
  IC: "from-blue-500 to-cyan-500",
  Resistor: "from-amber-500 to-yellow-500",
  Capacitor: "from-emerald-500 to-green-500",
  Diode: "from-red-500 to-rose-500",
  Transistor: "from-purple-500 to-violet-500",
  Sensor: "from-teal-500 to-emerald-500",
  Microcontroller: "from-cyan-500 to-blue-500",
  Connector: "from-orange-500 to-amber-500",
  Relay: "from-pink-500 to-rose-500",
  "Crystal Oscillator": "from-indigo-500 to-purple-500",
  "Motor Driver": "from-violet-500 to-purple-500",
  "Power Module": "from-yellow-500 to-orange-500",
  "Voltage Reference": "from-sky-500 to-cyan-500",
  "Communication Module": "from-green-500 to-emerald-500",
  "Display Module": "from-fuchsia-500 to-pink-500",
  Inductor: "from-lime-500 to-green-500",
};

export const NAV_LINKS = [
  { label: "Dashboard", href: "/" },
  { label: "Components", href: "/components" },
  { label: "Categories", href: "/categories" },
  { label: "Footprints", href: "/footprints" },
  { label: "Favorites", href: "/favorites" },
  { label: "Calculators", href: "/calculators" },
  { label: "About", href: "/about" },
];

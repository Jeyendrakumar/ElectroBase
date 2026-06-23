import React from "react";

/**
 * Returns a high-quality SVG representing the schematic/circuit symbol
 * for a given category. Can be customized by component name if needed.
 */
export function getSchematicSvg(category: string, name?: string): React.ReactNode {
  const normalizedCategory = category.toLowerCase();

  switch (normalizedCategory) {
    case "resistor":
      return (
        <svg className="w-24 h-24 text-amber-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 10,50 L 30,50 L 34,40 L 42,60 L 50,40 L 58,60 L 66,40 L 70,50 L 90,50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="50" y="25" fill="currentColor" className="text-[10px] font-mono font-bold" textAnchor="middle">R</text>
        </svg>
      );

    case "capacitor":
      const isElectrolytic = name?.toLowerCase().includes("electrolytic") || false;
      return (
        <svg className="w-24 h-24 text-emerald-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Left Lead */}
          <line x1="10" y1="50" x2="44" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          {/* Right Lead */}
          <line x1="56" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Left Plate */}
          <line x1="44" y1="30" x2="44" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          
          {/* Right Plate (Curved for electrolytic or straight for ceramic) */}
          {isElectrolytic ? (
            <path d="M 56,30 Q 51,50 56,70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
          ) : (
            <line x1="56" y1="30" x2="56" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          )}

          {isElectrolytic && (
            <text x="36" y="28" fill="currentColor" className="text-[12px] font-mono font-bold" textAnchor="middle">+</text>
          )}
          <text x="50" y="20" fill="currentColor" className="text-[10px] font-mono font-bold" textAnchor="middle">C</text>
        </svg>
      );

    case "diode":
      const isLeds = name?.toLowerCase().includes("led") || false;
      const isZeners = name?.toLowerCase().includes("zener") || false;
      return (
        <svg className="w-24 h-24 text-rose-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Left Lead */}
          <line x1="10" y1="50" x2="38" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          {/* Right Lead */}
          <line x1="58" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Triangle Body */}
          <path d="M 38,32 L 58,50 L 38,68 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          
          {/* Vertical Bar (Cathode) */}
          {isZeners ? (
            <path d="M 58,32 L 62,32 L 58,32 L 58,68 L 54,68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          ) : (
            <line x1="58" y1="32" x2="58" y2="68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          )}

          {/* LED Radiating Arrows */}
          {isLeds && (
            <>
              <line x1="50" y1="24" x2="62" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <polygon points="62,12 57,14 60,17" fill="currentColor" />
              <line x1="58" y1="28" x2="70" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <polygon points="70,16 65,18 68,21" fill="currentColor" />
            </>
          )}
          <text x="50" y="85" fill="currentColor" className="text-[10px] font-mono font-bold" textAnchor="middle">D</text>
        </svg>
      );

    case "transistor":
      const isMosfet = name?.toLowerCase().includes("irf") || name?.toLowerCase().includes("mosfet") || false;
      return (
        <svg className="w-24 h-24 text-purple-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Circle border */}
          <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
          
          {/* Leads */}
          <line x1="15" y1="50" x2="35" y2="50" stroke="currentColor" strokeWidth="2.5" /> {/* Base / Gate */}
          <line x1="55" y1="20" x2="55" y2="35" stroke="currentColor" strokeWidth="2.5" /> {/* Collector / Drain */}
          <line x1="55" y1="65" x2="55" y2="80" stroke="currentColor" strokeWidth="2.5" /> {/* Emitter / Source */}

          {isMosfet ? (
            // MOSFET Schematic Symbol
            <>
              <line x1="38" y1="35" x2="38" y2="65" stroke="currentColor" strokeWidth="3" /> {/* Gate plate */}
              <line x1="44" y1="35" x2="44" y2="65" stroke="currentColor" strokeWidth="2" strokeDasharray="5 2" /> {/* Channels */}
              <line x1="44" y1="35" x2="55" y2="35" stroke="currentColor" strokeWidth="2" />
              <line x1="44" y1="65" x2="55" y2="65" stroke="currentColor" strokeWidth="2" />
              <line x1="44" y1="50" x2="55" y2="50" stroke="currentColor" strokeWidth="2" />
              {/* Arrow */}
              <polygon points="44,50 51,46 51,54" fill="currentColor" />
            </>
          ) : (
            // BJT NPN Schematic Symbol
            <>
              <line x1="40" y1="35" x2="40" y2="65" stroke="currentColor" strokeWidth="3" />
              <line x1="40" y1="50" x2="35" y2="50" stroke="currentColor" strokeWidth="2" />
              <line x1="40" y1="40" x2="55" y2="28" stroke="currentColor" strokeWidth="2" />
              <line x1="40" y1="60" x2="55" y2="72" stroke="currentColor" strokeWidth="2" />
              {/* Arrow NPN */}
              <polygon points="55,72 49,69 51,66" fill="currentColor" />
            </>
          )}
          <text x="75" y="54" fill="currentColor" className="text-[10px] font-mono font-bold">Q</text>
        </svg>
      );

    case "sensor":
      return (
        <svg className="w-24 h-24 text-teal-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="25" width="50" height="50" rx="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1.5" />
          <line x1="50" y1="50" x2="56" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M 15,20 Q 50,-5 85,20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
          <text x="50" y="90" fill="currentColor" className="text-[9px] font-mono font-bold" textAnchor="middle">SENSOR</text>
        </svg>
      );

    case "microcontroller":
      return (
        <svg className="w-24 h-24 text-cyan-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main MCU package box */}
          <rect x="25" y="25" width="50" height="50" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
          {/* Corner index pin */}
          <circle cx="32" cy="32" r="2.5" fill="currentColor" />
          
          {/* Left Pins */}
          <line x1="12" y1="35" x2="25" y2="35" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="45" x2="25" y2="45" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="55" x2="25" y2="55" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="65" x2="25" y2="65" stroke="currentColor" strokeWidth="1.5" />
          
          {/* Right Pins */}
          <line x1="75" y1="35" x2="88" y2="35" stroke="currentColor" strokeWidth="1.5" />
          <line x1="75" y1="45" x2="88" y2="45" stroke="currentColor" strokeWidth="1.5" />
          <line x1="75" y1="55" x2="88" y2="55" stroke="currentColor" strokeWidth="1.5" />
          <line x1="75" y1="65" x2="88" y2="65" stroke="currentColor" strokeWidth="1.5" />
          
          {/* Top Pins */}
          <line x1="35" y1="12" x2="35" y2="25" stroke="currentColor" strokeWidth="1.5" />
          <line x1="45" y1="12" x2="45" y2="25" stroke="currentColor" strokeWidth="1.5" />
          <line x1="55" y1="12" x2="55" y2="25" stroke="currentColor" strokeWidth="1.5" />
          <line x1="65" y1="12" x2="65" y2="25" stroke="currentColor" strokeWidth="1.5" />

          {/* Bottom Pins */}
          <line x1="35" y1="75" x2="35" y2="88" stroke="currentColor" strokeWidth="1.5" />
          <line x1="45" y1="75" x2="45" y2="88" stroke="currentColor" strokeWidth="1.5" />
          <line x1="55" y1="75" x2="55" y2="88" stroke="currentColor" strokeWidth="1.5" />
          <line x1="65" y1="75" x2="65" y2="88" stroke="currentColor" strokeWidth="1.5" />

          <text x="50" y="53" fill="currentColor" className="text-[10px] font-mono font-bold" textAnchor="middle">MCU</text>
        </svg>
      );

    case "connector":
      return (
        <svg className="w-24 h-24 text-orange-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Male headers */}
          <rect x="20" y="40" width="60" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="30" y1="30" x2="30" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="42" y1="30" x2="42" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="54" y1="30" x2="54" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="66" y1="30" x2="66" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          
          <line x1="30" y1="60" x2="30" y2="70" stroke="currentColor" strokeWidth="1.5" />
          <line x1="42" y1="60" x2="42" y2="70" stroke="currentColor" strokeWidth="1.5" />
          <line x1="54" y1="60" x2="54" y2="70" stroke="currentColor" strokeWidth="1.5" />
          <line x1="66" y1="60" x2="66" y2="70" stroke="currentColor" strokeWidth="1.5" />
          <text x="50" y="85" fill="currentColor" className="text-[9px] font-mono font-bold" textAnchor="middle">CONN</text>
        </svg>
      );

    case "relay":
      return (
        <svg className="w-24 h-24 text-pink-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Relay coil symbol */}
          <rect x="20" y="25" width="22" height="50" stroke="currentColor" strokeWidth="2" />
          <line x1="20" y1="25" x2="42" y2="75" stroke="currentColor" strokeWidth="1.5" />
          <line x1="10" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="42" y1="50" x2="52" y2="50" stroke="currentColor" strokeWidth="2" />

          {/* Switch contacts */}
          <line x1="55" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="70" y1="50" x2="85" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          
          {/* Normally closed / open terminals */}
          <circle cx="85" cy="32" r="2.5" fill="currentColor" />
          <circle cx="85" cy="62" r="2.5" fill="currentColor" />
          <line x1="87" y1="32" x2="95" y2="32" stroke="currentColor" strokeWidth="1.5" />
          <line x1="87" y1="62" x2="95" y2="62" stroke="currentColor" strokeWidth="1.5" />

          <text x="31" y="20" fill="currentColor" className="text-[10px] font-mono font-bold" textAnchor="middle">K</text>
        </svg>
      );

    case "crystal oscillator":
      return (
        <svg className="w-24 h-24 text-indigo-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Leads */}
          <line x1="10" y1="50" x2="38" y2="50" stroke="currentColor" strokeWidth="2.5" />
          <line x1="62" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2.5" />
          
          {/* Plates */}
          <line x1="38" y1="30" x2="38" y2="70" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="62" y1="30" x2="62" y2="70" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          
          {/* Crystal block */}
          <rect x="44" y="35" width="12" height="30" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <text x="50" y="25" fill="currentColor" className="text-[10px] font-mono font-bold" textAnchor="middle">Y</text>
        </svg>
      );

    case "inductor":
      return (
        <svg className="w-24 h-24 text-lime-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Leads */}
          <line x1="10" y1="50" x2="25" y2="50" stroke="currentColor" strokeWidth="2.5" />
          <line x1="75" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2.5" />
          
          {/* Coils */}
          <path d="M 25,50 C 25,35 37.5,35 37.5,50 C 37.5,35 50,35 50,50 C 50,35 62.5,35 62.5,50 C 62.5,35 75,35 75,50" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <text x="50" y="25" fill="currentColor" className="text-[10px] font-mono font-bold" textAnchor="middle">L</text>
        </svg>
      );

    case "motor driver":
      return (
        <svg className="w-24 h-24 text-violet-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="25" width="50" height="50" rx="3" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="50" y="55" fill="currentColor" className="text-[14px] font-bold font-mono" textAnchor="middle">M</text>
          <line x1="12" y1="35" x2="25" y2="35" stroke="currentColor" strokeWidth="1.5" />
          <line x1="12" y1="65" x2="25" y2="65" stroke="currentColor" strokeWidth="1.5" />
          <line x1="75" y1="35" x2="88" y2="35" stroke="currentColor" strokeWidth="1.5" />
          <line x1="75" y1="65" x2="88" y2="65" stroke="currentColor" strokeWidth="1.5" />
          <text x="50" y="90" fill="currentColor" className="text-[9px] font-mono font-bold" textAnchor="middle">DRIVER</text>
        </svg>
      );

    case "power module":
      return (
        <svg className="w-24 h-24 text-yellow-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="60" height="60" rx="4" stroke="currentColor" strokeWidth="2" />
          <path d="M 30,35 H 42 M 36,29 V 41" stroke="currentColor" strokeWidth="1.5" />
          <path d="M 58,35 H 70" stroke="currentColor" strokeWidth="1.5" />
          <path d="M 30,65 H 42" stroke="currentColor" strokeWidth="1.5" />
          <path d="M 58,65 H 70 M 64,59 V 71" stroke="currentColor" strokeWidth="1.5" />
          <text x="50" y="53" fill="currentColor" className="text-[12px] font-mono font-bold" textAnchor="middle">DC-DC</text>
        </svg>
      );

    case "voltage reference":
      return (
        <svg className="w-24 h-24 text-sky-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" />
          <path d="M 35,50 C 35,35 45,35 50,50 C 55,65 65,65 65,50" stroke="currentColor" strokeWidth="2" fill="none" />
          <text x="50" y="92" fill="currentColor" className="text-[9px] font-mono font-bold" textAnchor="middle">VREF</text>
        </svg>
      );

    case "communication module":
      return (
        <svg className="w-24 h-24 text-green-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="50" y1="85" x2="50" y2="40" stroke="currentColor" strokeWidth="2.5" />
          <path d="M 35,30 L 50,40 L 65,30 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M 40,25 A 15,15 0 0 1 60,25" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 30,18 A 28,28 0 0 1 70,18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <text x="50" y="95" fill="currentColor" className="text-[9px] font-mono font-bold" textAnchor="middle">RF / WIFI</text>
        </svg>
      );

    case "display module":
      return (
        <svg className="w-24 h-24 text-fuchsia-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="25" width="70" height="50" rx="3" stroke="currentColor" strokeWidth="2" />
          <rect x="22" y="32" width="56" height="30" rx="1" stroke="currentColor" strokeWidth="1" />
          <line x1="28" y1="67" x2="72" y2="67" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="50" y="51" fill="currentColor" className="text-[8px] font-mono" textAnchor="middle">16x2 LCD</text>
        </svg>
      );

    default: // fallback to standard chip symbol (IC/op-amp outline)
      return (
        <svg className="w-24 h-24 text-cyan-500/80 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="15" width="70" height="70" rx="8" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" />
          <circle cx="50" cy="50" r="16" stroke="currentColor" strokeWidth="2" />
          <line x1="50" y1="15" x2="50" y2="34" stroke="currentColor" strokeWidth="2" />
          <line x1="50" y1="66" x2="50" y2="85" stroke="currentColor" strokeWidth="2" />
          <line x1="15" y1="50" x2="34" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="66" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}

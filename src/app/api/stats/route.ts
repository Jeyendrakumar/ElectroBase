import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalComponents, totalICs, totalResistors, totalCapacitors] = await Promise.all([
      prisma.component.count(),
      prisma.component.count({ where: { category: "IC" } }),
      prisma.component.count({ where: { category: "Resistor" } }),
      prisma.component.count({ where: { category: "Capacitor" } }),
    ]);

    return NextResponse.json({
      totalComponents,
      totalICs,
      totalResistors,
      totalCapacitors,
    });
  } catch (error: any) {
    console.error("Stats API failed", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalComponents, totalDatasheets, allCategories] = await Promise.all([
      prisma.component.count(),
      prisma.component.count({ where: { datasheetUrl: { not: null } } }),
      prisma.category.findMany({ select: { name: true } }),
    ]);

    // Dynamically count per category
    const categoryCounts: Record<string, number> = {};
    await Promise.all(
      allCategories.map(async (cat) => {
        categoryCounts[cat.name] = await prisma.component.count({
          where: { category: cat.name },
        });
      })
    );

    // Sort categories by count descending to find top categories
    const sortedCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a);

    return NextResponse.json({
      totalComponents,
      totalDatasheets,
      totalCategories: allCategories.length,
      categoryCounts,
      topCategories: sortedCategories.slice(0, 6).map(([name, count]) => ({ name, count })),
    });
  } catch (error: any) {
    console.error("Stats API failed", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}


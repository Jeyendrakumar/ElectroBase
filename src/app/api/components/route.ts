import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const footprint = searchParams.get("footprint") || "";
    const manufacturer = searchParams.get("manufacturer") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || String(ITEMS_PER_PAGE), 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { manufacturer: { contains: query } },
        { description: { contains: query } },
        { tags: { contains: query } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (footprint) {
      where.footprint = footprint;
    }

    if (manufacturer) {
      where.manufacturer = manufacturer;
    }

    const [components, total] = await Promise.all([
      prisma.component.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.component.count({ where }),
    ]);

    // Unique manufacturers, categories, footprints for selection dropdowns
    const [allCategories, allFootprints, distinctManufacturers] = await Promise.all([
      prisma.category.findMany({ select: { name: true } }),
      prisma.footprint.findMany({ select: { name: true } }),
      prisma.component.findMany({
        select: { manufacturer: true },
        distinct: ["manufacturer"],
      }),
    ]);

    return NextResponse.json({
      components,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      categories: allCategories.map((c) => c.name),
      footprints: allFootprints.map((f) => f.name),
      manufacturers: distinctManufacturers.map((m) => m.manufacturer).sort(),
    });
  } catch (error: any) {
    console.error("Components query API failed", error);
    return NextResponse.json({ error: "Failed to fetch components" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Simple password validation check for security (basic middleware replacement)
    const adminPassword = req.headers.get("x-admin-password");
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      category,
      manufacturer,
      description,
      datasheetUrl,
      imageUrl,
      footprint,
      packageType,
      pinCount,
      tags,
      pins = [],
      specs = [],
    } = body;

    if (!name || !category || !manufacturer || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const component = await prisma.component.create({
      data: {
        name,
        category,
        manufacturer,
        description,
        datasheetUrl: datasheetUrl || null,
        imageUrl: imageUrl || null,
        footprint: footprint || null,
        packageType: packageType || null,
        pinCount: pinCount ? parseInt(pinCount, 10) : null,
        tags: tags || "",
        pins: {
          create: pins.map((p: any) => ({
            pinNumber: parseInt(p.pinNumber, 10),
            pinName: p.pinName,
            description: p.description || "",
          })),
        },
        specifications: {
          create: specs.map((s: any) => ({
            parameter: s.parameter,
            value: s.value,
            unit: s.unit || null,
          })),
        },
      },
    });

    return NextResponse.json(component, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create component", error);
    return NextResponse.json({ error: "Failed to create component" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const footprints = await prisma.footprint.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(footprints);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch footprints" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, dimensions, recommendedLayout } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const footprint = await prisma.footprint.create({
      data: {
        name,
        description,
        dimensions,
        recommendedLayout,
      },
    });

    return NextResponse.json(footprint, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create footprint" }, { status: 500 });
  }
}

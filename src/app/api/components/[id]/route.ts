import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const component = await prisma.component.findUnique({
      where: { id },
      include: {
        pins: { orderBy: { pinNumber: "asc" } },
        specifications: true,
      },
    });

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    return NextResponse.json(component);
  } catch (error: any) {
    console.error("GET single component API failed", error);
    return NextResponse.json({ error: "Failed to fetch component" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    // First delete existing pins/specs to recreate them
    await prisma.$transaction([
      prisma.pinConfiguration.deleteMany({ where: { componentId: id } }),
      prisma.specification.deleteMany({ where: { componentId: id } }),
      prisma.component.update({
        where: { id },
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
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT single component API failed", error);
    return NextResponse.json({ error: "Failed to update component" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const adminPassword = req.headers.get("x-admin-password");
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.component.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE single component API failed", error);
    return NextResponse.json({ error: "Failed to delete component" }, { status: 500 });
  }
}

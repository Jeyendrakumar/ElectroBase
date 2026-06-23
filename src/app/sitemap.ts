import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Standard static routes
  const routes = ["", "/components", "/categories", "/footprints", "/favorites"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const components = await prisma.component.findMany({ select: { id: true, updatedAt: true } });

    const componentRoutes = components.map((comp) => ({
      url: `${baseUrl}/components/${comp.id}`,
      lastModified: comp.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...routes, ...componentRoutes];
  } catch (e) {
    return routes;
  }
}

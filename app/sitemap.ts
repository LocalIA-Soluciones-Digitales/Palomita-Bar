import type { MetadataRoute } from "next";

const routes = ["", "/carta", "/historia", "/cocteleria", "/galeria", "/contacto"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://palomitabar.es";

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}

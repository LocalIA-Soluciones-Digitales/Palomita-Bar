import type { MetadataRoute } from "next";

// "/historia" no es una ruta propia: es la sección #nosotros de la portada
// (ver NAV_LINKS en src/lib/constants.ts), ya cubierta por "".
const routes = ["", "/carta", "/cocteleria", "/galeria", "/reservar"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://palomitabar.es";

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}

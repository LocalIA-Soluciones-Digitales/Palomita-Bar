import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/pedido"] },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://palomitabar.es"}/sitemap.xml`,
  };
}

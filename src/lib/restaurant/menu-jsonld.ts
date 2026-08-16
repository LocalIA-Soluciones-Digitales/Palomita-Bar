import type { Categoria, Producto } from "@/lib/restaurant/types";

/**
 * Construye el schema.org Menu/MenuSection/MenuItem para una carta filtrada.
 * Habilita resultados enriquecidos de Google con precios directamente en la
 * carta, algo más específico que el BarOrPub genérico del layout.
 */
export function buildMenuJsonLd(categorias: Categoria[], productos: Producto[], name: string) {
  const hasMenuSection = categorias
    .map((categoria) => {
      const items = productos.filter((p) => p.categoria_id === categoria.id && p.disponible);
      if (items.length === 0) return null;
      return {
        "@type": "MenuSection",
        name: categoria.nombre,
        hasMenuItem: items.map((producto) => ({
          "@type": "MenuItem",
          name: producto.nombre,
          description: producto.descripcion ?? undefined,
          offers: {
            "@type": "Offer",
            price: (producto.precio_centimos / 100).toFixed(2),
            priceCurrency: "EUR",
          },
        })),
      };
    })
    .filter((section): section is NonNullable<typeof section> => section !== null);

  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name,
    hasMenuSection,
  };
}

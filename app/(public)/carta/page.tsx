import type { Metadata } from "next";
import { getCarta, getCategorias } from "@/lib/restaurant/queries";
import { CategoryMenu } from "@/components/menu/CategoryMenu";
import { buildMenuJsonLd } from "@/lib/restaurant/menu-jsonld";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Carta",
  description:
    "Carta de picoteo de Palomita Bar en Barakaldo: rolls, gyozas, tartar, tablas y postres.",
};

export default async function CartaPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const [{ product }, categorias, productos] = await Promise.all([
    searchParams,
    getCategorias(),
    getCarta(),
  ]);
  const picoteo = categorias.filter((categoria) => categoria.tipo === "comida");
  const menuJsonLd = buildMenuJsonLd(picoteo, productos, "Carta de picoteo — Palomita Bar");

  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuJsonLd) }}
      />
      <p className="text-xs uppercase tracking-widest2 text-noche-primary">Carta</p>
      <h1 className="mt-4 font-display text-5xl text-noche-ink">Picoteo</h1>
      <p className="mt-4 max-w-lg text-noche-ink-muted">
        Carta completa de picoteo. Para pedir desde la mesa, escanea el código
        QR que tienes en ella. ¿Buscas los cócteles? Están en{" "}
        <a href="/cocteleria" className="underline underline-offset-2 hover:text-noche-primary">
          Coctelería
        </a>
        .
      </p>

      <div className="mt-16">
        <CategoryMenu categorias={picoteo} productos={productos} highlightProductId={product} />
      </div>
    </div>
  );
}

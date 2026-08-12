import type { Metadata } from "next";
import { getCarta, getCategorias } from "@/lib/restaurant/queries";
import { CategoryMenu } from "@/components/menu/CategoryMenu";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Carta",
  description:
    "Carta de Palomita Bar en Barakaldo: picoteo, rolls, gyozas, tartar y cócteles de autor.",
};

export default async function CartaPage() {
  const [categorias, productos] = await Promise.all([getCategorias(), getCarta()]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-brand-pink">Carta</p>
      <h1 className="mt-4 font-display text-5xl">Picoteo y cócteles</h1>
      <p className="mt-4 max-w-lg text-brand-ink/70">
        Carta completa. Para pedir desde la mesa, escanea el código QR que
        tienes en ella.
      </p>

      <div className="mt-16">
        <CategoryMenu categorias={categorias} productos={productos} />
      </div>
    </div>
  );
}

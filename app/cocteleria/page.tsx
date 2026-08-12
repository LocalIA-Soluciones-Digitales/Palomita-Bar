import type { Metadata } from "next";
import { getCarta, getCategorias } from "@/lib/restaurant/queries";
import { CategoryMenu } from "@/components/menu/CategoryMenu";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Coctelería",
  description: "Coctelería de autor en Palomita Bar, Barakaldo: clásicos y la Palomita, la casa.",
};

export default async function CocteleriaPage() {
  const [categorias, productos] = await Promise.all([getCategorias(), getCarta()]);
  const bebidas = categorias.filter((categoria) => categoria.tipo === "bebida");

  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-brand-pink">Coctelería</p>
      <h1 className="mt-4 font-display text-5xl">De la barra</h1>
      <p className="mt-4 max-w-lg text-brand-ink/70">
        Clásicos bien ejecutados y la casa: la Palomita, con jimador
        reposado, pomelo y soda.
      </p>

      <div className="mt-16">
        <CategoryMenu categorias={bebidas} productos={productos} />
      </div>
    </div>
  );
}

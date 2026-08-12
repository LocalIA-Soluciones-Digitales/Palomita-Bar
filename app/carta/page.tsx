import type { Metadata } from "next";
import { COCKTAIL_MENU, FOOD_MENU } from "@/lib/menu-data";
import { MenuSectionList } from "@/components/menu/MenuSectionList";

export const metadata: Metadata = {
  title: "Carta",
  description:
    "Carta de Palomita Bar en Barakaldo: picoteo, rolls, gyozas, tartar y cócteles de autor.",
};

export default function CartaPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-brand-pink">Carta</p>
      <h1 className="mt-4 font-display text-5xl">Picoteo y cócteles</h1>
      <p className="mt-4 max-w-lg text-brand-ink/70">
        Selección de referencia. La carta completa, con disponibilidad en
        tiempo real, se activará al conectar el pedido en mesa.
      </p>

      <div className="mt-16">
        <MenuSectionList sections={FOOD_MENU} />
      </div>

      <div className="mt-24">
        <p className="text-xs uppercase tracking-widest2 text-brand-pink">Coctelería</p>
        <h2 className="mt-4 font-display text-4xl">De la barra</h2>
        <div className="mt-12">
          <MenuSectionList sections={COCKTAIL_MENU} />
        </div>
      </div>
    </div>
  );
}

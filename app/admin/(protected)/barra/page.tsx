import type { Metadata } from "next";
import { BarraPOS } from "@/components/admin/BarraPOS";

export const metadata: Metadata = {
  title: "Venta Rápida",
  robots: { index: false },
};

export default function BarraPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-noche-ink">Venta Rápida</h1>
      <p className="mt-1 text-sm text-noche-ink-muted">
        Toma pedidos rápidos en barra sin asignarlos a ninguna mesa: selecciona productos, envíalos a
        cocina y cobra al momento.
      </p>
      <BarraPOS />
    </div>
  );
}

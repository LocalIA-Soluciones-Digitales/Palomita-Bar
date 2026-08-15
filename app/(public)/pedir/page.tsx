import type { Metadata } from "next";
import { getCarta, getCategorias, validarMesa } from "@/lib/restaurant/queries";
import { CartProvider } from "@/components/cart/cart-context";
import { TableSessionProvider } from "@/components/mesa/table-session-context";
import { TableEntry } from "@/components/mesa/TableEntry";
import { PedirExperience } from "@/components/pedir/PedirExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedir en mesa",
  robots: { index: false },
};

export default async function PedirPage({
  searchParams,
}: {
  searchParams: Promise<{ mesa?: string }>;
}) {
  const { mesa: mesaIdentificador } = await searchParams;

  const mesa = mesaIdentificador ? await validarMesa(mesaIdentificador) : null;

  if (mesaIdentificador && !mesa) {
    return (
      <EmptyState
        title="Mesa no disponible"
        description="Este código no corresponde a una mesa activa. Avisa al personal si crees que es un error."
      />
    );
  }

  const [categorias, productos] = await Promise.all([getCategorias(), getCarta()]);
  const mesaLabel = mesa
    ? mesa.nombre
      ? `${mesa.nombre} (Mesa ${mesa.numero})`
      : `Mesa ${mesa.numero}`
    : "Modo prueba · sin mesa asignada";

  return (
    <TableSessionProvider mesaIdentificador={mesa?.identificador}>
      <CartProvider>
        <TableEntry>
          <PedirExperience
            categorias={categorias}
            productos={productos}
            mesaLabel={mesaLabel}
            mesaIdentificador={mesaIdentificador}
          />
        </TableEntry>
      </CartProvider>
    </TableSessionProvider>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-display text-3xl text-noche-ink">{title}</h1>
      <p className="mt-4 text-noche-ink-muted">{description}</p>
    </div>
  );
}

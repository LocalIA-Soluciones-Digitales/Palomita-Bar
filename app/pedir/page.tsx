import type { Metadata } from "next";
import { getCarta, getCategorias, validarMesa } from "@/lib/restaurant/queries";
import { CartProvider } from "@/components/cart/cart-context";
import { ProductRow } from "@/components/pedir/ProductRow";
import { CartBar } from "@/components/pedir/CartBar";

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

  if (!mesaIdentificador) {
    return (
      <EmptyState
        title="Escanea el QR de tu mesa"
        description="Para pedir necesitas escanear el código QR que tienes en la mesa."
      />
    );
  }

  const mesa = await validarMesa(mesaIdentificador);

  if (!mesa) {
    return (
      <EmptyState
        title="Mesa no disponible"
        description="Este código no corresponde a una mesa activa. Avisa al personal si crees que es un error."
      />
    );
  }

  const [categorias, productos] = await Promise.all([getCategorias(), getCarta()]);

  return (
    <CartProvider>
      <div className="mx-auto max-w-3xl px-6 pb-32 pt-16">
        <p className="text-xs uppercase tracking-widest2 text-brand-pink">Mesa {mesa.numero}</p>
        <h1 className="mt-4 font-display text-4xl">¿Qué te apetece?</h1>

        <div className="mt-12 space-y-16">
          {categorias.map((categoria) => {
            const items = productos.filter((p) => p.categoria_id === categoria.id);
            if (items.length === 0) return null;

            return (
              <div key={categoria.id}>
                <h2 className="font-display text-2xl text-brand-pink">{categoria.nombre}</h2>
                <div className="mt-4 divide-y divide-brand-black/10">
                  {items.map((producto) => (
                    <ProductRow key={producto.id} producto={producto} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CartBar mesaIdentificador={mesaIdentificador} />
    </CartProvider>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="mt-4 text-brand-ink/70">{description}</p>
    </div>
  );
}

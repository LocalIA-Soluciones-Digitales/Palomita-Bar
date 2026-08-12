import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedir en mesa",
  robots: { index: false },
};

export default async function PedirPage({
  searchParams,
}: {
  searchParams: Promise<{ mesa?: string }>;
}) {
  const { mesa } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs uppercase tracking-widest2 text-brand-pink">
        {mesa ? `Mesa ${mesa}` : "Pedido en mesa"}
      </p>
      <h1 className="mt-4 font-display text-4xl">Próximamente</h1>
      <p className="mt-4 text-brand-ink/70">
        El sistema de pedido en mesa por QR está en construcción (carta
        dinámica, carrito y pago con Stripe). Mientras tanto, pide en barra.
      </p>
    </div>
  );
}

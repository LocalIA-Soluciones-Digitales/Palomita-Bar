import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPedidoPublico } from "@/lib/restaurant/queries";
import { PedidoStatus } from "@/components/pedido/PedidoStatus";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false },
};

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await getPedidoPublico(id);

  if (!pedido) {
    notFound();
  }

  return <PedidoStatus pedidoInicial={pedido} />;
}

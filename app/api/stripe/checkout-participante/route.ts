import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { getStripeClient } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RepartoParaPago {
  participante_id: string;
  nombre: string;
  sesion_id: string;
  items: { reparto_id: string; pedido_id: string; nombre: string; importe_centimos: number }[];
}

export async function POST(request: Request) {
  let participanteId: string | undefined;

  try {
    const body = await request.json();
    participanteId = body?.participanteId;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (!participanteId) {
    return NextResponse.json({ error: "Falta participanteId" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("get_reparto_para_pago", {
    p_participante_id: participanteId,
  });

  if (error || !data) {
    return NextResponse.json({ error: "Comensal no encontrado" }, { status: 404 });
  }

  const reparto = data as unknown as RepartoParaPago;

  if (reparto.items.length === 0) {
    return NextResponse.json(
      { error: "No hay nada pendiente de pago para este comensal" },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pedidoId = reparto.items[0]?.pedido_id;

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: reparto.items.map((item) => ({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: item.importe_centimos,
          product_data: { name: `Tu parte de: ${item.nombre}` },
        },
      })),
      metadata: { participante_id: reparto.participante_id },
      success_url: `${siteUrl}/pedido/${pedidoId}`,
      cancel_url: `${siteUrl}/pedido/${pedidoId}`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "No se pudo crear la sesión de pago" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Error creando sesión de Stripe para reparto", err);
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
  }
}

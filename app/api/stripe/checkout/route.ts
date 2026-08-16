import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { getStripeClient } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PedidoParaPago {
  id: string;
  payment_method: string;
  payment_status: string;
  items: { nombre: string; cantidad: number; precio_unitario_centimos: number }[];
}

// Tope de seguridad para el importe de propina que acepta el endpoint:
// evita que una manipulación del body cree una sesión de Stripe por un
// importe absurdo. 50 € por pedido es más que suficiente en este contexto.
const TIP_MAX_CENTIMOS = 5000;

export async function POST(request: Request) {
  let pedidoId: string | undefined;
  let tipCentimos = 0;

  try {
    const body = await request.json();
    pedidoId = body?.pedidoId;
    if (typeof body?.tipCentimos === "number" && Number.isInteger(body.tipCentimos)) {
      tipCentimos = Math.min(Math.max(body.tipCentimos, 0), TIP_MAX_CENTIMOS);
    }
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (!pedidoId) {
    return NextResponse.json({ error: "Falta pedidoId" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("get_pedido_para_pago", {
    p_pedido_id: pedidoId,
  });

  if (error || !data) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const pedido = data as unknown as PedidoParaPago;

  if (pedido.payment_method !== "ONLINE" || pedido.payment_status !== "PENDING") {
    return NextResponse.json(
      { error: "Este pedido no admite pago online en este momento" },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        ...pedido.items.map((item) => ({
          quantity: item.cantidad,
          price_data: {
            currency: "eur",
            unit_amount: item.precio_unitario_centimos,
            product_data: { name: item.nombre },
          },
        })),
        ...(tipCentimos > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "eur",
                  unit_amount: tipCentimos,
                  product_data: { name: "Propina" },
                },
              },
            ]
          : []),
      ],
      metadata: { pedido_id: pedido.id },
      success_url: `${siteUrl}/pedido/${pedido.id}`,
      cancel_url: `${siteUrl}/pedido/${pedido.id}`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "No se pudo crear la sesión de pago" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Error creando sesión de Stripe", err);
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
  }
}

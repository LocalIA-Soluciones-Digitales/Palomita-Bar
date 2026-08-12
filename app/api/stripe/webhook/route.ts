import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Firma de webhook de Stripe inválida", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  // La confirmación real del pago viene SIEMPRE de aquí, nunca de la
  // redirección del navegador a success_url.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const pedidoId = session.metadata?.pedido_id;

    if (pedidoId) {
      const supabaseServiceRole = createSupabaseServiceRoleClient();
      const { error } = await supabaseServiceRole.rpc("marcar_pedido_pagado", {
        p_pedido_id: pedidoId,
        p_stripe_session_id: session.id,
        p_stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      });

      if (error) {
        console.error("Error marcando el pedido como pagado", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}

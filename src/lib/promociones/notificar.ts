import "server-only";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { errorMessage } from "@/lib/format";

interface PremioParaNotificar {
  comensal_nombre: string | null;
  comensal_telefono: string;
  comensal_email: string | null;
  premio_descripcion: string;
  regla_nombre: string;
  notificado_en: string | null;
}

async function enviarEmail(to: string, premioDescripcion: string, reglaNombre: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    throw new Error("Resend no está configurado (RESEND_API_KEY/RESEND_FROM)");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: "Tienes un premio esperándote en Palomita Bar",
      text: `Gracias por venir tantas veces. Has conseguido: ${premioDescripcion} (${reglaNombre}). Enséñanos este correo en tu próxima visita para canjearlo.`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
  }
}

async function enviarWhatsapp(telefono: string, premioDescripcion: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const templateSid = process.env.TWILIO_TEMPLATE_SID;
  if (!sid || !token || !from || !templateSid) {
    throw new Error(
      "Twilio WhatsApp no está configurado (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM/TWILIO_TEMPLATE_SID)",
    );
  }

  const body = new URLSearchParams({
    To: `whatsapp:${telefono}`,
    From: `whatsapp:${from}`,
    ContentSid: templateSid,
    ContentVariables: JSON.stringify({ "1": premioDescripcion }),
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Twilio respondió ${res.status}: ${await res.text()}`);
  }
}

/**
 * Envía el aviso de un premio otorgado: email si el comensal dejó correo,
 * si no WhatsApp a su teléfono. `forzar` reenvía aunque ya conste como
 * notificado (botón "Reenviar" del panel); el webhook/cron automáticos
 * dejan `forzar` en false para no duplicar avisos.
 */
export async function notificarPremio(premioId: string, opciones?: { forzar?: boolean }): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("get_premio_para_notificar", { p_premio_id: premioId });
  if (error) throw error;

  const premio = (Array.isArray(data) ? data[0] : data) as PremioParaNotificar | undefined;
  if (!premio) throw new Error("Premio no encontrado");
  if (premio.notificado_en && !opciones?.forzar) return;

  const canal: "EMAIL" | "WHATSAPP" = premio.comensal_email ? "EMAIL" : "WHATSAPP";

  try {
    if (canal === "EMAIL") {
      await enviarEmail(premio.comensal_email as string, premio.premio_descripcion, premio.regla_nombre);
    } else {
      await enviarWhatsapp(premio.comensal_telefono, premio.premio_descripcion);
    }
    await supabase.rpc("marcar_premio_notificado", {
      p_premio_id: premioId,
      p_canal: canal,
      p_error: null,
    });
  } catch (err) {
    await supabase.rpc("marcar_premio_notificado", {
      p_premio_id: premioId,
      p_canal: canal,
      p_error: errorMessage(err).slice(0, 500),
    });
    throw err;
  }
}

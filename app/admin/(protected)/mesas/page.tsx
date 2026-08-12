import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MesasTabs } from "@/components/admin/MesasTabs";
import type { MesaEstadoAdmin } from "@/lib/restaurant/admin-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mesas",
  robots: { index: false },
};

export default async function MesasAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_mesas_estado_admin", {
    p_cliente_id: process.env.NEXT_PUBLIC_PALOMITA_CLIENTE_ID,
  });

  const mesasIniciales = error ? [] : ((data as unknown as MesaEstadoAdmin[]) ?? []);

  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink">Mesas</h1>
      <MesasTabs mesasIniciales={mesasIniciales} />
    </div>
  );
}

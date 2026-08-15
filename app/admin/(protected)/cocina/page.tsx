import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CocinaTabs } from "@/components/admin/CocinaTabs";
import type { PedidoCocina } from "@/lib/restaurant/cocina-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cocina",
  robots: { index: false },
};

export default async function CocinaPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_pedidos_cocina");

  const pedidosIniciales = (error ? [] : (data as unknown as PedidoCocina[]) ?? []);

  return (
    <div>
      <h1 className="font-display text-2xl text-noche-ink">Cocina</h1>
      <CocinaTabs pedidosIniciales={pedidosIniciales} />
    </div>
  );
}

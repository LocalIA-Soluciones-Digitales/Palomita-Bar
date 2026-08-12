import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { KitchenBoard } from "@/components/cocina/KitchenBoard";
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
    <div className="min-h-screen p-4 sm:p-6">
      <h1 className="font-display text-2xl text-brand-ink">Cocina</h1>
      <KitchenBoard pedidosIniciales={pedidosIniciales} />
    </div>
  );
}

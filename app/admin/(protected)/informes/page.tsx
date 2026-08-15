import type { Metadata } from "next";
import { InformeVentas } from "@/components/admin/InformeVentas";

export const metadata: Metadata = {
  title: "Informes",
  robots: { index: false },
};

export default function InformesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-noche-ink print:hidden">Informes</h1>
      <InformeVentas />
    </div>
  );
}

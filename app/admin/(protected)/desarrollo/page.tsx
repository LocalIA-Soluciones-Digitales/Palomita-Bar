import type { Metadata } from "next";
import { InformeDesarrollo } from "@/components/admin/InformeDesarrollo";

export const metadata: Metadata = {
  title: "Desarrollo",
  robots: { index: false },
};

export default function DesarrolloPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-brand-ink print:hidden">
        Panel de desarrollador
      </h1>
      <InformeDesarrollo />
    </div>
  );
}

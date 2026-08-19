import type { Metadata } from "next";
import { CartaTabs } from "@/components/admin/CartaTabs";

export const metadata: Metadata = {
  title: "Carta",
  robots: { index: false },
};

export default function CartaAdminPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-noche-ink">Carta</h1>
      <CartaTabs />
    </div>
  );
}

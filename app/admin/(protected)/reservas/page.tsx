import type { Metadata } from "next";
import { ReservasBoard } from "@/components/admin/ReservasBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservas",
  robots: { index: false },
};

export default function ReservasAdminPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-noche-ink">Reservas</h1>
      <ReservasBoard />
    </div>
  );
}

import type { Metadata } from "next";
import { InformeProfesional } from "@/components/admin/InformeProfesional";

export const metadata: Metadata = {
  title: "Informe profesional",
  robots: { index: false },
};

export default function InformesAdministradorPage() {
  return <InformeProfesional />;
}

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminRole } from "@/lib/auth/role";

export default async function AdministradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const role = await getAdminRole(supabase);

  if (role !== "administrador") {
    redirect("/admin/cocina");
  }

  return <>{children}</>;
}

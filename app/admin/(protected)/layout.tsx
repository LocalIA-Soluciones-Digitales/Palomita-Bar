import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminRole } from "@/lib/auth/role";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const role = await getAdminRole(supabase);

  return (
    <div className="min-h-screen bg-noche-bg">
      <AdminNav role={role} />
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DesarrolloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: esDeveloper } = await supabase.rpc("is_developer");

  if (!esDeveloper) {
    redirect("/admin");
  }

  return <>{children}</>;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { esDeveloperAdmin } from "@/lib/restaurant/admin-queries";

const LINKS = [
  { href: "/admin/cocina", label: "Cocina" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/mesas", label: "Mesas" },
  { href: "/admin/ventas", label: "Ventas" },
  { href: "/admin/configuracion", label: "Configuración" },
];

const LINK_DESARROLLO = { href: "/admin/desarrollo", label: "Desarrollo" };

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [esDeveloper, setEsDeveloper] = useState(false);

  useEffect(() => {
    esDeveloperAdmin().then(setEsDeveloper);
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const links = esDeveloper ? [...LINKS, LINK_DESARROLLO] : LINKS;

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-brand-black/10 bg-white px-4 py-2 sm:px-6">
      <span className="mr-4 font-display text-lg">Palomita</span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-1.5 text-xs uppercase tracking-widest2 ${
            pathname?.startsWith(link.href)
              ? "bg-brand-black text-brand-cream"
              : "text-brand-ink/60 hover:text-brand-ink"
          }`}
        >
          {link.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={handleLogout}
        className="ml-auto px-3 py-1.5 text-xs uppercase tracking-widest2 text-brand-ink/40 hover:text-brand-pink"
      >
        Salir
      </button>
    </nav>
  );
}

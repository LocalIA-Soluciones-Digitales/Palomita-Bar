"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  BoxIcon,
  ChartBarIcon,
  FireIcon,
  LogoutIcon,
  ReportIcon,
  SettingsIcon,
  TableIcon,
  TagIcon,
} from "@/components/icons";

const LINKS = [
  { href: "/admin/cocina", label: "Cocina", icon: FireIcon },
  { href: "/admin/mesas", label: "Mesas", icon: TableIcon },
  { href: "/admin/productos", label: "Productos", icon: BoxIcon },
  { href: "/admin/categorias", label: "Categorías", icon: TagIcon },
  { href: "/admin/ventas", label: "Ventas", icon: ChartBarIcon },
  { href: "/admin/informes", label: "Informes", icon: ReportIcon },
  { href: "/admin/configuracion", label: "Configuración", icon: SettingsIcon },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-20 flex flex-wrap items-center gap-1 border-b border-noche-border bg-noche-bg/90 px-4 py-2 backdrop-blur-md sm:px-6">
      <span className="mr-4 font-display text-lg text-noche-ink">Palomita</span>
      {LINKS.map((link) => {
        const Icon = link.icon;
        const activo = pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest2 transition-colors ${
              activo
                ? "bg-noche-primary/15 text-noche-primary"
                : "text-noche-ink-muted hover:bg-noche-surface hover:text-noche-ink"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {link.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest2 text-noche-ink-faint transition-colors hover:bg-noche-danger/10 hover:text-noche-danger"
      >
        <LogoutIcon className="h-3.5 w-3.5" />
        Salir
      </button>
    </nav>
  );
}

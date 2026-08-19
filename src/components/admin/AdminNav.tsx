"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { AdminRole } from "@/lib/auth/role";
import {
  AlertIcon,
  BoxIcon,
  CalendarIcon,
  ChartBarIcon,
  ChevronDownIcon,
  EyeIcon,
  FireIcon,
  GaugeIcon,
  GlassIcon,
  LogoutIcon,
  ReportIcon,
  SettingsIcon,
  TableIcon,
  TagIcon,
  UsersIcon,
} from "@/components/icons";

const GESTION_LINKS = [
  { href: "/admin/cocina", label: "Comandas", icon: FireIcon },
  { href: "/admin/mesas", label: "Salón", icon: TableIcon },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarIcon },
  { href: "/admin/barra", label: "Venta Rápida", icon: GlassIcon },
  { href: "/admin/productos", label: "Productos", icon: BoxIcon },
  { href: "/admin/categorias", label: "Categorías", icon: TagIcon },
  { href: "/admin/ventas", label: "Ventas", icon: ChartBarIcon },
  { href: "/admin/configuracion", label: "Configuración", icon: SettingsIcon },
];

const ADMINISTRADOR_LINKS = [
  { href: "/admin/administrador/resumen", label: "Resumen", icon: GaugeIcon },
  { href: "/admin/administrador/informes", label: "Informes", icon: ReportIcon },
  { href: "/admin/administrador/visitas", label: "Visitas", icon: EyeIcon },
  { href: "/admin/administrador/clientes", label: "Clientes", icon: UsersIcon },
  { href: "/admin/administrador/errores", label: "Errores", icon: AlertIcon },
];

export function AdminNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const enPanelAdministrador = pathname?.startsWith("/admin/administrador") ?? false;
  const links = role === "administrador" && enPanelAdministrador ? ADMINISTRADOR_LINKS : GESTION_LINKS;

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-20 flex flex-wrap items-center gap-1 border-b border-noche-border bg-noche-bg/90 px-4 py-2 backdrop-blur-md sm:px-6">
      {role === "administrador" ? (
        <div className="relative mr-4">
          <button
            type="button"
            onClick={() => setSwitcherOpen((v) => !v)}
            className="flex items-center gap-1.5 font-display text-lg text-noche-ink"
          >
            {enPanelAdministrador ? "Panel Administrador" : "Panel de Gestión"}
            <ChevronDownIcon className="h-4 w-4 text-noche-ink-muted" />
          </button>
          {switcherOpen ? (
            <div className="absolute left-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-noche-border bg-noche-surface shadow-lg">
              <Link
                href="/admin/administrador/resumen"
                onClick={() => setSwitcherOpen(false)}
                className={`block px-4 py-2.5 text-sm ${
                  enPanelAdministrador
                    ? "bg-noche-primary/15 text-noche-primary"
                    : "text-noche-ink hover:bg-noche-surface-2"
                }`}
              >
                Panel Administrador
              </Link>
              <Link
                href="/admin/cocina"
                onClick={() => setSwitcherOpen(false)}
                className={`block px-4 py-2.5 text-sm ${
                  !enPanelAdministrador
                    ? "bg-noche-primary/15 text-noche-primary"
                    : "text-noche-ink hover:bg-noche-surface-2"
                }`}
              >
                Panel de Gestión
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <span className="mr-4 font-display text-lg text-noche-ink">Palomita</span>
      )}

      {links.map((link) => {
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

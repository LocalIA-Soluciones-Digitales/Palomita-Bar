"use client";

import { useEffect, useState } from "react";
import {
  actualizarCamareroActivoAdmin,
  crearCamareroAdmin,
  getCamarerosAdmin,
} from "@/lib/restaurant/admin-queries";
import type { CamareroAdmin } from "@/lib/restaurant/admin-types";
import { PlusIcon, UsersIcon } from "@/components/icons";

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  const letras = partes.slice(0, 2).map((parte) => parte.charAt(0));
  return letras.join("").toUpperCase();
}

function mensajeError(base: string, err: unknown): string {
  const detalle =
    err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : null;
  return detalle ? `${base} (${detalle})` : base;
}

export function CamarerosGestion() {
  const [camareros, setCamareros] = useState<CamareroAdmin[] | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const data = await getCamarerosAdmin();
      setCamareros(data);
      setError(null);
    } catch (err) {
      setError(mensajeError("No se ha podido cargar el personal.", err));
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleCrear = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    try {
      await crearCamareroAdmin(nombre);
      setNuevoNombre("");
      await cargar();
    } catch (err) {
      setError(mensajeError("No se ha podido dar de alta al camarero.", err));
    }
  };

  const handleToggleActivo = async (camarero: CamareroAdmin) => {
    try {
      await actualizarCamareroActivoAdmin(camarero.id, !camarero.activo);
      await cargar();
    } catch (err) {
      setError(mensajeError("No se ha podido actualizar.", err));
    }
  };

  const activos = camareros?.filter((c) => c.activo) ?? [];

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-noche-border bg-noche-surface">
      <div className="flex items-center justify-between border-b border-noche-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-noche-primary/10 text-noche-primary">
            <UsersIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-noche-ink">Personal</p>
            <p className="text-xs text-noche-ink-faint">Quién puede atender mesas en el plano de Salón.</p>
          </div>
        </div>
        {camareros ? (
          <span className="rounded-full bg-noche-surface-2 px-2.5 py-1 text-xs text-noche-ink-muted">
            {activos.length} activo{activos.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="flex gap-2 px-4 pt-4">
        <input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCrear()}
          placeholder="Nombre del camarero"
          className="flex-1 rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
        />
        <button
          type="button"
          onClick={handleCrear}
          className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink transition hover:brightness-110"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Añadir
        </button>
      </div>

      {error ? <p className="px-4 pt-2 text-sm text-noche-danger">{error}</p> : null}

      <ul className="mt-3 divide-y divide-noche-border">
        {camareros?.map((camarero) => (
          <li key={camarero.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  camarero.activo
                    ? "bg-noche-primary/15 text-noche-primary"
                    : "bg-noche-surface-2 text-noche-ink-faint"
                }`}
              >
                {iniciales(camarero.nombre)}
              </span>
              <span
                className={`text-sm ${camarero.activo ? "text-noche-ink" : "text-noche-ink-faint line-through"}`}
              >
                {camarero.nombre}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleActivo(camarero)}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest2 transition ${
                camarero.activo
                  ? "text-noche-ink-muted hover:bg-noche-danger/10 hover:text-noche-danger"
                  : "text-noche-positive hover:bg-noche-positive/10"
              }`}
            >
              {camarero.activo ? "Dar de baja" : "Reactivar"}
            </button>
          </li>
        ))}
        {camareros?.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-noche-ink-muted">
            Todavía no hay personal dado de alta.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  actualizarCamareroActivoAdmin,
  crearCamareroAdmin,
  getCamarerosAdmin,
} from "@/lib/restaurant/admin-queries";
import type { CamareroAdmin } from "@/lib/restaurant/admin-types";
import { PlusIcon, UsersIcon } from "@/components/icons";

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

  return (
    <div className="mt-6 rounded-lg border border-noche-border bg-noche-surface p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest2 text-noche-ink-muted">
        <UsersIcon className="h-3.5 w-3.5" />
        Personal (camareros)
      </p>
      <p className="mt-1 text-xs text-noche-ink-faint">
        Se usan para asignar quién atiende cada mesa en el plano de Salón.
      </p>

      <div className="mt-3 flex gap-2">
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
          className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Añadir
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-noche-danger">{error}</p> : null}

      <ul className="mt-4 divide-y divide-noche-border">
        {camareros?.map((camarero) => (
          <li key={camarero.id} className="flex items-center justify-between py-2 text-sm">
            <span className={camarero.activo ? "text-noche-ink" : "text-noche-ink-faint line-through"}>
              {camarero.nombre}
            </span>
            <button
              type="button"
              onClick={() => handleToggleActivo(camarero)}
              className={`text-xs uppercase tracking-widest2 ${
                camarero.activo ? "text-noche-ink-muted hover:text-noche-danger" : "text-noche-positive"
              }`}
            >
              {camarero.activo ? "Dar de baja" : "Reactivar"}
            </button>
          </li>
        ))}
        {camareros?.length === 0 ? (
          <li className="py-2 text-sm text-noche-ink-muted">Todavía no hay personal dado de alta.</li>
        ) : null}
      </ul>
    </div>
  );
}

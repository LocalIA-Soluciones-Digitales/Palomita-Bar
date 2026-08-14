"use client";

import { useEffect, useState } from "react";
import {
  actualizarCamareroActivoAdmin,
  crearCamareroAdmin,
  getCamarerosAdmin,
} from "@/lib/restaurant/admin-queries";
import type { CamareroAdmin } from "@/lib/restaurant/admin-types";

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
    <div className="mt-6 border border-brand-black/10 bg-white p-4">
      <p className="text-xs uppercase tracking-widest2 text-brand-ink/50">
        Personal (camareros)
      </p>
      <p className="mt-1 text-xs text-brand-ink/40">
        Se usan para asignar quién atiende cada mesa en el plano de Salón.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCrear()}
          placeholder="Nombre del camarero"
          className="flex-1 border border-brand-black/20 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleCrear}
          className="bg-brand-black px-4 py-2 text-xs uppercase tracking-widest2 text-brand-cream"
        >
          Añadir
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <ul className="mt-4 divide-y divide-brand-black/10">
        {camareros?.map((camarero) => (
          <li key={camarero.id} className="flex items-center justify-between py-2 text-sm">
            <span className={camarero.activo ? "" : "text-brand-ink/40 line-through"}>
              {camarero.nombre}
            </span>
            <button
              type="button"
              onClick={() => handleToggleActivo(camarero)}
              className={`text-xs uppercase tracking-widest2 ${
                camarero.activo ? "text-brand-ink/60 hover:text-red-600" : "text-green-700"
              }`}
            >
              {camarero.activo ? "Dar de baja" : "Reactivar"}
            </button>
          </li>
        ))}
        {camareros?.length === 0 ? (
          <li className="py-2 text-sm text-brand-ink/50">Todavía no hay personal dado de alta.</li>
        ) : null}
      </ul>
    </div>
  );
}

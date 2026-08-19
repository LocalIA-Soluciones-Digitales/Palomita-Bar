"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { prefijoZona } from "@/lib/restaurant/mesa-label";
import { AlertIcon, CheckIcon, ChevronDownIcon, CloseIcon } from "@/components/icons";
import type { ZonaAdmin } from "@/lib/restaurant/admin-types";

interface MesaOpcion {
  id: string;
  numero: string;
  capacidad: number;
  zona_id: string | null;
}

/**
 * Busca la combinación más pequeña de mesas libres cuya capacidad conjunta
 * cubra `numPersonas`, priorizando mesas grandes para usar el menor número
 * de mesas posible.
 */
function sugerirCombinacion(mesas: MesaOpcion[], numPersonas: number): string[] {
  const candidatas = [...mesas].sort((a, b) => b.capacidad - a.capacidad);
  const elegidas: MesaOpcion[] = [];
  let suma = 0;
  for (const mesa of candidatas) {
    if (suma >= numPersonas) break;
    elegidas.push(mesa);
    suma += mesa.capacidad;
  }
  return suma >= numPersonas ? elegidas.map((m) => m.id) : [];
}

export function MesaMultiSelect({
  mesas,
  zonas,
  selectedIds,
  onChange,
  ocupadas,
  numPersonas,
  disabled,
  fullWidth,
}: {
  mesas: MesaOpcion[];
  zonas: ZonaAdmin[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  ocupadas: Set<string>;
  numPersonas: number;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const handleClick = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [abierto]);

  const mesaPorId = useMemo(() => new Map(mesas.map((m) => [m.id, m])), [mesas]);
  const seleccionadas = useMemo(
    () => selectedIds.map((id) => mesaPorId.get(id)).filter((m): m is MesaOpcion => Boolean(m)),
    [selectedIds, mesaPorId],
  );
  const capacidadTotal = seleccionadas.reduce((sum, m) => sum + m.capacidad, 0);
  const capacidadSuficiente = selectedIds.length === 0 || capacidadTotal >= numPersonas;

  const sugerencia = useMemo(() => {
    if (capacidadSuficiente) return null;
    const libres = mesas.filter((m) => !ocupadas.has(m.id) && !selectedIds.includes(m.id));
    const combinacionLibre = sugerirCombinacion(libres, numPersonas);
    if (combinacionLibre.length > 1) return combinacionLibre;
    const combinacionTotal = sugerirCombinacion(
      mesas.filter((m) => !ocupadas.has(m.id) || selectedIds.includes(m.id)),
      numPersonas,
    );
    return combinacionTotal.length > 1 ? combinacionTotal : null;
  }, [capacidadSuficiente, mesas, ocupadas, selectedIds, numPersonas]);

  const toggleMesa = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const label = (mesa: MesaOpcion) => `${prefijoZona(mesa.zona_id, zonas)} Mesa ${mesa.numero}`.trim();

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto((v) => !v)}
        className={`flex min-w-[9rem] items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-xs disabled:opacity-50 ${
          fullWidth ? "w-full" : ""
        } ${
          capacidadSuficiente
            ? "border-noche-border bg-noche-surface-2 text-noche-ink"
            : "border-amber-500/40 bg-amber-500/10 text-amber-300"
        }`}
      >
        <span className="truncate">
          {seleccionadas.length === 0
            ? "Sin mesa asignada"
            : seleccionadas.map((m) => label(m)).join(" + ")}
        </span>
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" />
      </button>

      {!capacidadSuficiente ? (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-400">
          <AlertIcon className="h-3 w-3 shrink-0" />
          Capacidad {capacidadTotal}/{numPersonas}
          {sugerencia ? " · junta otra mesa" : ""}
        </p>
      ) : null}

      {abierto ? (
        <div className="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-noche-border bg-noche-surface p-2 shadow-xl">
          {sugerencia ? (
            <button
              type="button"
              onClick={() => {
                onChange(sugerencia);
                setAbierto(false);
              }}
              className="mb-2 flex w-full items-center gap-2 rounded-lg border border-noche-primary/40 bg-noche-primary/10 px-2 py-1.5 text-left text-[11px] text-noche-primary hover:bg-noche-primary/20"
            >
              <CheckIcon className="h-3.5 w-3.5 shrink-0" />
              Juntar {sugerencia.map((id) => label(mesaPorId.get(id)!)).join(" + ")}
            </button>
          ) : null}

          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            {mesas.map((mesa) => {
              const marcada = selectedIds.includes(mesa.id);
              const ocupada = ocupadas.has(mesa.id) && !marcada;
              return (
                <label
                  key={mesa.id}
                  className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs ${
                    ocupada ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-noche-surface-2"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={marcada}
                      disabled={ocupada}
                      onChange={() => toggleMesa(mesa.id)}
                      className="accent-noche-primary"
                    />
                    {label(mesa)}
                  </span>
                  <span className="text-noche-ink-faint">{mesa.capacidad}p</span>
                </label>
              );
            })}
          </div>

          {seleccionadas.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-noche-border px-2 py-1 text-[11px] text-noche-ink-muted hover:bg-noche-surface-2"
            >
              <CloseIcon className="h-3 w-3" />
              Quitar todas
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

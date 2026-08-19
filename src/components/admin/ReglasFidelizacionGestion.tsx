"use client";

import { useEffect, useRef, useState } from "react";
import {
  eliminarReglaPromocionAdmin,
  getReglasPromocionAdmin,
  upsertReglaPromocionAdmin,
} from "@/lib/restaurant/admin-queries";
import type { ReglaPromocionAdmin } from "@/lib/restaurant/admin-types";
import { errorMessage } from "@/lib/format";
import { PencilIcon, PlusIcon, StarIcon, TrashIcon } from "@/components/icons";
import { SkeletonCard } from "@/components/admin/Skeleton";

interface ReglaForm {
  nombre: string;
  cualquierHora: boolean;
  horaDesde: string;
  horaHasta: string;
  visitasRequeridas: string;
  ventanaDias: string;
  premioDescripcion: string;
  activa: boolean;
}

const FORM_VACIO: ReglaForm = {
  nombre: "",
  cualquierHora: true,
  horaDesde: "20:00",
  horaHasta: "23:59",
  visitasRequeridas: "10",
  ventanaDias: "",
  premioDescripcion: "",
  activa: true,
};

function resumenRegla(regla: ReglaPromocionAdmin): string {
  const tramo =
    regla.hora_desde && regla.hora_hasta
      ? `entre ${regla.hora_desde.slice(0, 5)} y ${regla.hora_hasta.slice(0, 5)}`
      : "a cualquier hora";
  const ventana = regla.ventana_dias ? `, en los últimos ${regla.ventana_dias} días` : "";
  return `Cada ${regla.visitas_requeridas} visitas ${tramo}${ventana} → ${regla.premio_descripcion}`;
}

export function ReglasFidelizacionGestion() {
  const [reglas, setReglas] = useState<ReglaPromocionAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ReglaForm>(FORM_VACIO);
  const [nombreError, setNombreError] = useState<string | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      setReglas(await getReglasPromocionAdmin());
    } catch (err) {
      setError(`No se han podido cargar las reglas: ${errorMessage(err)}`);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      setNombreError("El nombre no puede estar vacío.");
      nombreRef.current?.focus();
      return;
    }
    const visitasRequeridas = Number(form.visitasRequeridas);
    if (!Number.isInteger(visitasRequeridas) || visitasRequeridas < 1) {
      setError("El número de visitas requeridas no es válido.");
      return;
    }
    if (!form.premioDescripcion.trim()) {
      setError("Indica en qué consiste el premio.");
      return;
    }
    setNombreError(null);
    setGuardando(true);
    setError(null);
    try {
      await upsertReglaPromocionAdmin({
        id: editandoId ?? undefined,
        nombre: form.nombre.trim(),
        horaDesde: form.cualquierHora ? null : form.horaDesde,
        horaHasta: form.cualquierHora ? null : form.horaHasta,
        visitasRequeridas,
        ventanaDias: form.ventanaDias ? Number(form.ventanaDias) : null,
        premioDescripcion: form.premioDescripcion.trim(),
        activa: form.activa,
      });
      setForm(FORM_VACIO);
      setEditandoId(null);
      setFormAbierto(false);
      await cargar();
    } catch (err) {
      setError(`No se ha podido guardar la regla: ${errorMessage(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (regla: ReglaPromocionAdmin) => {
    setEditandoId(regla.id);
    setForm({
      nombre: regla.nombre,
      cualquierHora: !regla.hora_desde || !regla.hora_hasta,
      horaDesde: regla.hora_desde?.slice(0, 5) ?? FORM_VACIO.horaDesde,
      horaHasta: regla.hora_hasta?.slice(0, 5) ?? FORM_VACIO.horaHasta,
      visitasRequeridas: String(regla.visitas_requeridas),
      ventanaDias: regla.ventana_dias ? String(regla.ventana_dias) : "",
      premioDescripcion: regla.premio_descripcion,
      activa: regla.activa,
    });
    setFormAbierto(true);
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setNombreError(null);
    setFormAbierto(false);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta regla de fidelización?")) return;
    try {
      await eliminarReglaPromocionAdmin(id);
      await cargar();
    } catch (err) {
      setError(`No se ha podido eliminar la regla: ${errorMessage(err)}`);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-noche-border bg-noche-surface">
      <div className="flex items-center justify-between border-b border-noche-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-noche-primary/10 text-noche-primary">
            <StarIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-noche-ink">Reglas de fidelización</p>
            <p className="text-xs text-noche-ink-faint">
              Define cuándo se gana un premio por visitas repetidas.
            </p>
          </div>
        </div>
        {!formAbierto ? (
          <button
            type="button"
            onClick={() => setFormAbierto(true)}
            className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-3 py-1.5 text-xs uppercase tracking-widest2 text-noche-ink transition hover:opacity-90"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Añadir regla
          </button>
        ) : null}
      </div>

      {formAbierto ? (
        <div className="space-y-3 border-b border-noche-border bg-noche-surface-2/40 px-4 py-4">
          <div>
            <label className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
              Nombre
            </label>
            <input
              ref={nombreRef}
              required
              placeholder="Ej. 10 cenas → tostada de desayuno"
              value={form.nombre}
              onChange={(e) => {
                setForm((f) => ({ ...f, nombre: e.target.value }));
                if (nombreError) setNombreError(null);
              }}
              className={`mt-1 w-full rounded-lg border bg-noche-surface-2 px-2.5 py-1.5 text-sm text-noche-ink outline-none transition ${
                nombreError ? "border-noche-danger" : "border-noche-border focus:border-noche-primary"
              }`}
            />
            {nombreError ? <p className="mt-1 text-[11px] text-noche-danger">{nombreError}</p> : null}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
                Visitas requeridas
              </label>
              <input
                type="number"
                min={1}
                value={form.visitasRequeridas}
                onChange={(e) => setForm((f) => ({ ...f, visitasRequeridas: e.target.value }))}
                className="mt-1 w-24 rounded-lg border border-noche-border bg-noche-surface-2 px-2.5 py-1.5 text-sm text-noche-ink outline-none transition focus:border-noche-primary"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
                Ventana (días, opcional)
              </label>
              <input
                type="number"
                min={1}
                placeholder="Sin límite"
                value={form.ventanaDias}
                onChange={(e) => setForm((f) => ({ ...f, ventanaDias: e.target.value }))}
                className="mt-1 w-32 rounded-lg border border-noche-border bg-noche-surface-2 px-2.5 py-1.5 text-sm text-noche-ink outline-none transition focus:border-noche-primary"
              />
            </div>
            <label className="flex items-center gap-2 pb-1.5 text-xs text-noche-ink-muted">
              <input
                type="checkbox"
                checked={form.cualquierHora}
                onChange={(e) => setForm((f) => ({ ...f, cualquierHora: e.target.checked }))}
              />
              Cuenta a cualquier hora
            </label>
            {!form.cualquierHora ? (
              <div className="flex items-center gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
                    Desde
                  </label>
                  <input
                    type="time"
                    value={form.horaDesde}
                    onChange={(e) => setForm((f) => ({ ...f, horaDesde: e.target.value }))}
                    className="mt-1 rounded-lg border border-noche-border bg-noche-surface-2 px-2.5 py-1.5 text-sm text-noche-ink"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
                    Hasta
                  </label>
                  <input
                    type="time"
                    value={form.horaHasta}
                    onChange={(e) => setForm((f) => ({ ...f, horaHasta: e.target.value }))}
                    className="mt-1 rounded-lg border border-noche-border bg-noche-surface-2 px-2.5 py-1.5 text-sm text-noche-ink"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
              Premio
            </label>
            <input
              placeholder="Ej. Tostada de desayuno gratis"
              value={form.premioDescripcion}
              onChange={(e) => setForm((f) => ({ ...f, premioDescripcion: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-2.5 py-1.5 text-sm text-noche-ink outline-none transition focus:border-noche-primary"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-noche-ink-muted">
              <input
                type="checkbox"
                checked={form.activa}
                onChange={(e) => setForm((f) => ({ ...f, activa: e.target.checked }))}
              />
              Regla activa
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelar}
                className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando}
                className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-3.5 py-1.5 text-[11px] uppercase tracking-widest2 text-noche-ink transition hover:brightness-110 disabled:opacity-50"
              >
                {editandoId ? "Guardar cambios" : "Añadir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="px-4 pt-3 text-sm text-noche-danger">{error}</p> : null}

      <div className="px-4 py-2">
        {reglas === null ? (
          <SkeletonCard filas={2} />
        ) : reglas.length === 0 ? (
          <p className="py-3 text-sm text-noche-ink-muted">Todavía no hay reglas de fidelización.</p>
        ) : (
          <ul className="divide-y divide-noche-border/50">
            {reglas.map((regla) => (
              <li key={regla.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm text-noche-ink">
                    {regla.nombre}
                    {!regla.activa ? (
                      <span className="rounded-full bg-noche-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-widest2 text-noche-ink-faint">
                        Inactiva
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-noche-ink-faint">{resumenRegla(regla)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleEditar(regla)}
                    className="text-noche-ink-muted hover:text-noche-primary"
                    aria-label="Editar"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(regla.id)}
                    className="text-noche-ink-muted hover:text-noche-danger"
                    aria-label="Eliminar"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

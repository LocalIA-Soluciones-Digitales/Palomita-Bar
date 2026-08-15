"use client";

import { useEffect, useMemo, useState } from "react";
import {
  eliminarCategoriaAdmin,
  getCategoriasAdmin,
  upsertCategoriaAdmin,
} from "@/lib/restaurant/admin-queries";
import type { CategoriaAdmin } from "@/lib/restaurant/admin-types";
import { errorMessage } from "@/lib/format";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";

const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface CategoriaForm {
  nombre: string;
  tipo: "comida" | "bebida";
  orden: number;
}

const FORM_VACIO: CategoriaForm = { nombre: "", tipo: "comida", orden: 0 };

const TIPO_LABEL: Record<CategoriaForm["tipo"], string> = {
  comida: "Comida",
  bebida: "Bebida",
};

export default function CategoriasAdminPage() {
  const [categorias, setCategorias] = useState<CategoriaAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CategoriaForm>(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      setCategorias(await getCategoriasAdmin());
    } catch (err) {
      setError(`No se han podido cargar las categorías: ${errorMessage(err)}`);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const grupos = useMemo(() => {
    if (!categorias) return [];
    const ordenadas = [...categorias].sort((a, b) => a.orden - b.orden);
    return (["bebida", "comida"] as const)
      .map((tipo) => ({ tipo, items: ordenadas.filter((c) => c.tipo === tipo) }))
      .filter((g) => g.items.length > 0);
  }, [categorias]);

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      await upsertCategoriaAdmin({
        id: editandoId ?? undefined,
        nombre: form.nombre.trim(),
        slug: slugify(form.nombre),
        tipo: form.tipo,
        orden: form.orden,
      });
      setForm(FORM_VACIO);
      setEditandoId(null);
      setFormAbierto(false);
      await cargar();
    } catch (err) {
      setError(`No se ha podido guardar la categoría: ${errorMessage(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (categoria: CategoriaAdmin) => {
    setEditandoId(categoria.id);
    setForm({ nombre: categoria.nombre, tipo: categoria.tipo, orden: categoria.orden });
    setFormAbierto(true);
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setFormAbierto(false);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría? Los productos que la usen quedarán sin categoría.")) {
      return;
    }
    try {
      await eliminarCategoriaAdmin(id);
      await cargar();
    } catch (err) {
      setError(`No se ha podido eliminar la categoría: ${errorMessage(err)}`);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-noche-ink">Categorías</h1>
        {!formAbierto ? (
          <button
            type="button"
            onClick={() => setFormAbierto(true)}
            className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink transition hover:opacity-90"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Añadir categoría
          </button>
        ) : null}
      </div>

      {formAbierto ? (
        <div className="mt-6 rounded-xl border border-noche-border bg-noche-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
              {editandoId ? "Editar categoría" : "Nueva categoría"}
            </p>
            <button
              type="button"
              onClick={handleCancelar}
              className="text-xs uppercase tracking-widest2 text-noche-ink-faint hover:text-noche-ink"
            >
              Cerrar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
                Nombre
              </label>
              <input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
                Tipo
              </label>
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tipo: e.target.value as "comida" | "bebida" }))
                }
                className="mt-1 rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
              >
                <option value="comida">Comida</option>
                <option value="bebida">Bebida</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
                Orden
              </label>
              <input
                type="number"
                value={form.orden}
                onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))}
                className="mt-1 w-20 rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
              />
            </div>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink disabled:opacity-50"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {editandoId ? "Guardar cambios" : "Añadir"}
            </button>
            <button
              type="button"
              onClick={handleCancelar}
              className="text-xs uppercase tracking-widest2 text-noche-ink-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-noche-danger">{error}</p> : null}

      <div className="mt-6 space-y-5">
        {categorias === null ? (
          <p className="text-sm text-noche-ink-muted">Cargando…</p>
        ) : grupos.length === 0 ? (
          <p className="text-sm text-noche-ink-muted">Todavía no hay categorías.</p>
        ) : (
          grupos.map((grupo) => (
            <div
              key={grupo.tipo}
              className="overflow-hidden rounded-xl border border-noche-border bg-noche-surface shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-noche-border bg-noche-surface-2/60 px-4 py-2.5">
                <h2 className="font-display text-base text-noche-ink">{TIPO_LABEL[grupo.tipo]}</h2>
                <span className="rounded-full bg-noche-surface-2 px-2 py-0.5 text-xs text-noche-ink-muted">
                  {grupo.items.length}
                </span>
              </div>
              <div className="divide-y divide-noche-border/50">
                {grupo.items.map((categoria) => (
                  <div key={categoria.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-7 shrink-0 rounded-full bg-noche-surface-2 py-0.5 text-center text-xs text-noche-ink-muted">
                      {categoria.orden}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm text-noche-ink">
                      {categoria.nombre}
                    </p>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleEditar(categoria)}
                        className="text-noche-ink-muted hover:text-noche-primary"
                        aria-label="Editar"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(categoria.id)}
                        className="text-noche-ink-muted hover:text-noche-danger"
                        aria-label="Eliminar"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

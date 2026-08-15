"use client";

import { useEffect, useState } from "react";
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

export default function CategoriasAdminPage() {
  const [categorias, setCategorias] = useState<CategoriaAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CategoriaForm>(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
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
      <h1 className="font-display text-2xl text-noche-ink">Categorías</h1>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-noche-border bg-noche-surface p-4">
        <div className="flex-1">
          <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Nombre</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Tipo</label>
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
          <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Orden</label>
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
        {editandoId ? (
          <button
            type="button"
            onClick={() => {
              setEditandoId(null);
              setForm(FORM_VACIO);
            }}
            className="text-xs uppercase tracking-widest2 text-noche-ink-muted"
          >
            Cancelar
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-noche-danger">{error}</p> : null}

      <table className="mt-6 w-full border-collapse overflow-hidden rounded-lg bg-noche-surface text-sm text-noche-ink">
        <thead>
          <tr className="border-b border-noche-border text-left text-xs uppercase tracking-widest2 text-noche-ink-muted">
            <th className="p-3">Nombre</th>
            <th className="p-3">Tipo</th>
            <th className="p-3">Orden</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {categorias?.map((categoria) => (
            <tr key={categoria.id} className="border-b border-noche-border/50">
              <td className="p-3">{categoria.nombre}</td>
              <td className="p-3 capitalize">{categoria.tipo}</td>
              <td className="p-3">{categoria.orden}</td>
              <td className="p-3 text-right">
                <button
                  type="button"
                  onClick={() => handleEditar(categoria)}
                  className="mr-3 inline-flex items-center gap-1 text-xs uppercase tracking-widest2 text-noche-ink-muted hover:text-noche-primary"
                >
                  <PencilIcon className="h-3 w-3" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleEliminar(categoria.id)}
                  className="inline-flex items-center gap-1 text-xs uppercase tracking-widest2 text-noche-ink-muted hover:text-noche-danger"
                >
                  <TrashIcon className="h-3 w-3" />
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

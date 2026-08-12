"use client";

import { useEffect, useState } from "react";
import {
  eliminarProductoAdmin,
  getCategoriasAdmin,
  getProductosAdmin,
  subirImagenProducto,
  upsertProductoAdmin,
} from "@/lib/restaurant/admin-queries";
import type { CategoriaAdmin, ProductoAdmin } from "@/lib/restaurant/admin-types";
import { formatCentimos } from "@/lib/format";

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  precio: "",
  categoriaId: "",
  disponible: true,
  destacado: false,
  orden: 0,
  imagenUrl: null as string | null,
};

export default function ProductosAdminPage() {
  const [productos, setProductos] = useState<ProductoAdmin[] | null>(null);
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const cargar = async () => {
    try {
      const [p, c] = await Promise.all([getProductosAdmin(), getCategoriasAdmin()]);
      setProductos(p);
      setCategorias(c);
    } catch {
      setError("No se han podido cargar los productos.");
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleSubirImagen = async (file: File) => {
    setSubiendoImagen(true);
    setError(null);
    try {
      const url = await subirImagenProducto(file);
      setForm((f) => ({ ...f, imagenUrl: url }));
    } catch {
      setError("No se ha podido subir la imagen.");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleGuardar = async () => {
    const precioCentimos = Math.round(parseFloat(form.precio.replace(",", ".")) * 100);
    if (!form.nombre.trim() || Number.isNaN(precioCentimos) || precioCentimos < 0) {
      setError("Revisa el nombre y el precio.");
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await upsertProductoAdmin({
        id: editandoId ?? undefined,
        categoriaId: form.categoriaId || null,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precioCentimos,
        disponible: form.disponible,
        destacado: form.destacado,
        orden: form.orden,
        imagenUrl: form.imagenUrl,
      });
      setForm(FORM_VACIO);
      setEditandoId(null);
      await cargar();
    } catch {
      setError("No se ha podido guardar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (producto: ProductoAdmin) => {
    setEditandoId(producto.id);
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? "",
      precio: (producto.precio_centimos / 100).toFixed(2),
      categoriaId: producto.categoria_id ?? "",
      disponible: producto.disponible,
      destacado: producto.destacado,
      orden: producto.orden,
      imagenUrl: producto.imagen_url,
    });
  };

  const handleToggleDisponible = async (producto: ProductoAdmin) => {
    try {
      await upsertProductoAdmin({
        id: producto.id,
        categoriaId: producto.categoria_id,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        precioCentimos: producto.precio_centimos,
        disponible: !producto.disponible,
        destacado: producto.destacado,
        orden: producto.orden,
        imagenUrl: producto.imagen_url,
      });
      await cargar();
    } catch {
      setError("No se ha podido actualizar la disponibilidad.");
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await eliminarProductoAdmin(id);
      await cargar();
    } catch {
      setError("No se ha podido eliminar el producto.");
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl">Productos</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 border border-brand-black/10 bg-white p-4 sm:grid-cols-4">
        <div className="col-span-2">
          <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">Nombre</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
            Precio (€)
          </label>
          <input
            value={form.precio}
            onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
            placeholder="6,50"
            className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
            Categoría
          </label>
          <select
            value={form.categoriaId}
            onChange={(e) => setForm((f) => ({ ...f, categoriaId: e.target.value }))}
            className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
            Descripción
          </label>
          <input
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
          />
        </div>

        <div className="col-span-2 sm:col-span-4">
          <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">Foto</label>
          <div className="mt-1 flex items-center gap-3">
            {form.imagenUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imagenUrl}
                alt=""
                className="h-16 w-16 shrink-0 border border-brand-black/10 object-cover"
              />
            ) : (
              <div className="h-16 w-16 shrink-0 border border-dashed border-brand-black/20 bg-brand-sand" />
            )}
            <input
              type="file"
              accept="image/*"
              disabled={subiendoImagen}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSubirImagen(file);
              }}
              className="text-xs"
            />
            {subiendoImagen ? (
              <span className="text-xs text-brand-ink/50">Subiendo…</span>
            ) : null}
            {form.imagenUrl ? (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                className="text-xs uppercase tracking-widest2 text-brand-ink/40 hover:text-red-600"
              >
                Quitar
              </button>
            ) : null}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.disponible}
            onChange={(e) => setForm((f) => ({ ...f, disponible: e.target.checked }))}
          />
          Disponible
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.destacado}
            onChange={(e) => setForm((f) => ({ ...f, destacado: e.target.checked }))}
          />
          Destacado
        </label>

        <div className="col-span-2 flex items-center gap-3 sm:col-span-4">
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando || subiendoImagen}
            className="bg-brand-black px-4 py-2 text-xs uppercase tracking-widest2 text-brand-cream disabled:opacity-50"
          >
            {editandoId ? "Guardar cambios" : "Añadir producto"}
          </button>
          {editandoId ? (
            <button
              type="button"
              onClick={() => {
                setEditandoId(null);
                setForm(FORM_VACIO);
              }}
              className="text-xs uppercase tracking-widest2 text-brand-ink/50"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <table className="mt-6 w-full border-collapse bg-white text-sm">
        <thead>
          <tr className="border-b border-brand-black/10 text-left text-xs uppercase tracking-widest2 text-brand-ink/50">
            <th className="p-3" />
            <th className="p-3">Nombre</th>
            <th className="p-3">Categoría</th>
            <th className="p-3">Precio</th>
            <th className="p-3">Disponible</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {productos?.map((producto) => (
            <tr key={producto.id} className="border-b border-brand-black/5">
              <td className="p-3">
                {producto.imagen_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={producto.imagen_url}
                    alt=""
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-brand-sand" />
                )}
              </td>
              <td className="p-3">{producto.nombre}</td>
              <td className="p-3">{producto.categoria_nombre ?? "—"}</td>
              <td className="p-3">{formatCentimos(producto.precio_centimos)} €</td>
              <td className="p-3">
                <button
                  type="button"
                  onClick={() => handleToggleDisponible(producto)}
                  className={
                    producto.disponible
                      ? "bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                      : "bg-brand-black/10 px-2 py-0.5 text-xs font-medium text-brand-ink/50"
                  }
                >
                  {producto.disponible ? "Sí" : "No"}
                </button>
              </td>
              <td className="p-3 text-right">
                <button
                  type="button"
                  onClick={() => handleEditar(producto)}
                  className="mr-3 text-xs uppercase tracking-widest2 text-brand-ink/60 hover:text-brand-pink"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleEliminar(producto.id)}
                  className="text-xs uppercase tracking-widest2 text-brand-ink/60 hover:text-red-600"
                >
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

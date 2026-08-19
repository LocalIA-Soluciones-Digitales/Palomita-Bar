"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  eliminarProductoAdmin,
  getCategoriasAdmin,
  getProductosAdmin,
  subirImagenProducto,
  upsertProductoAdmin,
} from "@/lib/restaurant/admin-queries";
import type { CategoriaAdmin, ProductoAdmin } from "@/lib/restaurant/admin-types";
import { errorMessage, formatCentimos } from "@/lib/format";
import { BoxIcon, CheckIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Stat } from "@/components/admin/Stat";
import { SkeletonCard } from "@/components/admin/Skeleton";

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

export function ProductosGestion() {
  const [productos, setProductos] = useState<ProductoAdmin[] | null>(null);
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [precioError, setPrecioError] = useState<string | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const precioRef = useRef<HTMLInputElement>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const cargar = async () => {
    try {
      const [p, c] = await Promise.all([getProductosAdmin(), getCategoriasAdmin()]);
      setProductos(p);
      setCategorias(c);
    } catch (err) {
      setError(`No se han podido cargar los productos: ${errorMessage(err)}`);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const secciones = useMemo(() => {
    if (!productos) return [];
    const porCategoria = new Map<string, ProductoAdmin[]>();
    for (const producto of productos) {
      const clave = producto.categoria_id ?? "__sin_categoria__";
      const lista = porCategoria.get(clave) ?? [];
      lista.push(producto);
      porCategoria.set(clave, lista);
    }

    const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden);
    const gruposPorTipo = (tipo: CategoriaAdmin["tipo"]) =>
      categoriasOrdenadas
        .filter((c) => c.tipo === tipo && porCategoria.has(c.id))
        .map((c) => ({ id: c.id, nombre: c.nombre, productos: porCategoria.get(c.id)! }));

    const resultado = (["comida", "bebida"] as const)
      .map((tipo) => ({
        tipo,
        titulo: tipo === "comida" ? "Carta" : "Coctelería",
        grupos: gruposPorTipo(tipo),
      }))
      .filter((s) => s.grupos.length > 0);

    const sinCategoria = porCategoria.get("__sin_categoria__");
    if (sinCategoria) {
      resultado.push({
        tipo: "comida",
        titulo: "Sin categoría",
        grupos: [{ id: "__sin_categoria__", nombre: "Sin categoría", productos: sinCategoria }],
      });
    }
    return resultado;
  }, [productos, categorias]);

  const stats = useMemo(() => {
    if (!productos) return null;
    return {
      total: productos.length,
      disponibles: productos.filter((p) => p.disponible).length,
      destacados: productos.filter((p) => p.destacado).length,
      categorias: categorias.length,
    };
  }, [productos, categorias]);

  const handleSubirImagen = async (file: File) => {
    setSubiendoImagen(true);
    setError(null);
    try {
      const url = await subirImagenProducto(file);
      setForm((f) => ({ ...f, imagenUrl: url }));
    } catch (err) {
      setError(`No se ha podido subir la imagen: ${errorMessage(err)}`);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleGuardar = async () => {
    const precioCentimos = Math.round(parseFloat(form.precio.replace(",", ".")) * 100);
    const nombreInvalido = !form.nombre.trim();
    const precioInvalido = Number.isNaN(precioCentimos) || precioCentimos < 0;

    setNombreError(nombreInvalido ? "El nombre no puede estar vacío." : null);
    setPrecioError(precioInvalido ? "Escribe un precio válido, p. ej. 6,50." : null);

    if (nombreInvalido) {
      nombreRef.current?.focus();
      return;
    }
    if (precioInvalido) {
      precioRef.current?.focus();
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
      setFormAbierto(false);
      await cargar();
    } catch (err) {
      setError(`No se ha podido guardar el producto: ${errorMessage(err)}`);
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
    setFormAbierto(true);
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setNombreError(null);
    setPrecioError(null);
    setFormAbierto(false);
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
    } catch (err) {
      setError(`No se ha podido actualizar la disponibilidad: ${errorMessage(err)}`);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await eliminarProductoAdmin(id);
      await cargar();
    } catch (err) {
      setError(`No se ha podido eliminar el producto: ${errorMessage(err)}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-end gap-4">
        {!formAbierto ? (
          <button
            type="button"
            onClick={() => setFormAbierto(true)}
            className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink transition hover:opacity-90"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Añadir producto
          </button>
        ) : null}
      </div>

      {stats ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Productos" value={String(stats.total)} />
          <Stat label="Disponibles" value={String(stats.disponibles)} />
          <Stat label="Destacados" value={String(stats.destacados)} />
          <Stat label="Categorías" value={String(stats.categorias)} />
        </div>
      ) : null}

      {formAbierto ? (
        <div className="mt-6 max-w-3xl overflow-hidden rounded-xl border border-noche-border bg-noche-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-noche-border px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6.5 w-6.5 items-center justify-center rounded-md bg-noche-primary/10 text-noche-primary">
                <BoxIcon className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-medium text-noche-ink">
                  {editandoId ? "Editar producto" : "Nuevo producto"}
                </p>
                <p className="text-[11px] text-noche-ink-faint">Aparecerá en la carta pública.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelar}
              className="text-[11px] uppercase tracking-widest2 text-noche-ink-faint hover:text-noche-ink"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 px-3 py-3 sm:grid-cols-4">
            <div className="col-span-2">
              <label htmlFor="producto-nombre" className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
                Nombre
              </label>
              <input
                id="producto-nombre"
                ref={nombreRef}
                required
                aria-invalid={nombreError ? true : undefined}
                aria-describedby={nombreError ? "producto-nombre-error" : undefined}
                value={form.nombre}
                onChange={(e) => {
                  setForm((f) => ({ ...f, nombre: e.target.value }));
                  if (nombreError) setNombreError(null);
                }}
                className={`mt-1 w-full rounded-lg border bg-noche-surface-2 px-2.5 py-1.5 text-sm text-noche-ink outline-none transition ${
                  nombreError ? "border-noche-danger" : "border-noche-border focus:border-noche-primary"
                }`}
              />
              {nombreError ? (
                <p id="producto-nombre-error" className="mt-1 text-[11px] text-noche-danger">
                  {nombreError}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="producto-precio" className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
                Precio (€)
              </label>
              <input
                id="producto-precio"
                ref={precioRef}
                required
                inputMode="decimal"
                aria-invalid={precioError ? true : undefined}
                aria-describedby={precioError ? "producto-precio-error" : undefined}
                value={form.precio}
                onChange={(e) => {
                  setForm((f) => ({ ...f, precio: e.target.value }));
                  if (precioError) setPrecioError(null);
                }}
                placeholder="6,50"
                className={`mt-1 w-full rounded-lg border bg-noche-surface-2 px-2.5 py-1.5 text-sm text-noche-ink outline-none transition ${
                  precioError ? "border-noche-danger" : "border-noche-border focus:border-noche-primary"
                }`}
              />
              {precioError ? (
                <p id="producto-precio-error" className="mt-1 text-[11px] text-noche-danger">
                  {precioError}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
                Categoría
              </label>
              <select
                value={form.categoriaId}
                onChange={(e) => setForm((f) => ({ ...f, categoriaId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-2.5 py-1.5 text-sm text-noche-ink outline-none transition focus:border-noche-primary"
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
              <label className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
                Descripción
              </label>
              <input
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-2.5 py-1.5 text-sm text-noche-ink outline-none transition focus:border-noche-primary"
              />
            </div>

            <div className="col-span-2 sm:col-span-4">
              <label className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted">
                Foto
              </label>
              <div className="mt-1 flex items-center gap-3">
                {form.imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.imagenUrl}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg border border-noche-border object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 shrink-0 rounded-lg border border-dashed border-noche-border bg-noche-surface-2" />
                )}
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer rounded-lg border border-noche-border bg-noche-surface-2 px-2.5 py-1.5 text-[11px] uppercase tracking-widest2 text-noche-ink-muted transition hover:border-noche-primary hover:text-noche-ink">
                    {subiendoImagen ? "Subiendo…" : "Seleccionar imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={subiendoImagen}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSubirImagen(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  {form.imagenUrl ? (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                      className="text-[11px] uppercase tracking-widest2 text-noche-ink-faint hover:text-noche-danger"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="col-span-2 flex gap-2 sm:col-span-4">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, disponible: !f.disponible }))}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-widest2 transition ${
                  form.disponible
                    ? "border-noche-positive/40 bg-noche-positive/10 text-noche-positive"
                    : "border-noche-border bg-noche-surface-2 text-noche-ink-muted"
                }`}
              >
                {form.disponible ? <CheckIcon className="h-3 w-3" /> : null}
                Disponible
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, destacado: !f.destacado }))}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-widest2 transition ${
                  form.destacado
                    ? "border-noche-primary/40 bg-noche-primary/10 text-noche-primary"
                    : "border-noche-border bg-noche-surface-2 text-noche-ink-muted"
                }`}
              >
                {form.destacado ? <CheckIcon className="h-3 w-3" /> : null}
                Destacado
              </button>
            </div>

            <div className="col-span-2 flex items-center gap-3 border-t border-noche-border pt-3 sm:col-span-4">
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando || subiendoImagen}
                className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-3.5 py-1.5 text-[11px] uppercase tracking-widest2 text-noche-ink transition hover:brightness-110 disabled:opacity-50"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {editandoId ? "Guardar cambios" : "Añadir producto"}
              </button>
              <button
                type="button"
                onClick={handleCancelar}
                className="text-[11px] uppercase tracking-widest2 text-noche-ink-muted"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-noche-danger">{error}</p> : null}

      <div className="mt-6 space-y-8">
        {productos === null ? (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : secciones.length === 0 ? (
          <p className="text-sm text-noche-ink-muted">Todavía no hay productos.</p>
        ) : (
          secciones.map((seccion) => (
            <div key={seccion.titulo} className="space-y-3">
              <h2 className="text-xs uppercase tracking-widest2 text-noche-ink-faint">
                {seccion.titulo}
              </h2>
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {seccion.grupos.map((grupo) => (
                  <div
                    key={grupo.id}
                    className="overflow-hidden self-start rounded-xl border border-noche-border bg-noche-surface shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-noche-border bg-noche-surface-2/60 px-4 py-2.5">
                      <h3 className="font-display text-base text-noche-ink">{grupo.nombre}</h3>
                      <span className="rounded-full bg-noche-surface-2 px-2 py-0.5 text-xs text-noche-ink-muted">
                        {grupo.productos.length}
                      </span>
                    </div>
                    <div className="divide-y divide-noche-border/50">
                      {grupo.productos.map((producto) => (
                        <div key={producto.id} className="flex items-center gap-3 px-4 py-2.5">
                          {producto.imagen_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={producto.imagen_url}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-noche-surface-2" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-noche-ink">{producto.nombre}</p>
                            {producto.destacado ? (
                              <span className="text-xs text-noche-primary">Destacado</span>
                            ) : null}
                          </div>
                          <span className="w-16 shrink-0 text-right text-sm text-noche-ink-muted">
                            {formatCentimos(producto.precio_centimos)} €
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleDisponible(producto)}
                            className={
                              producto.disponible
                                ? "shrink-0 rounded-full bg-noche-positive/15 px-2 py-0.5 text-xs font-medium text-noche-positive"
                                : "shrink-0 rounded-full bg-noche-surface-2 px-2 py-0.5 text-xs font-medium text-noche-ink-muted"
                            }
                          >
                            {producto.disponible ? "Sí" : "No"}
                          </button>
                          <div className="flex shrink-0 items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleEditar(producto)}
                              className="text-noche-ink-muted hover:text-noche-primary"
                              aria-label="Editar"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminar(producto.id)}
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
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

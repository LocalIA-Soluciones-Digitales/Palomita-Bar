"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  actualizarMesaActivaAdmin,
  actualizarMesaCapacidadAdmin,
  actualizarMesaNombreAdmin,
  actualizarMesaZonaAdmin,
  crearMesaAdmin,
  getMesasAdmin,
  getZonasAdmin,
  regenerarQrMesaAdmin,
} from "@/lib/restaurant/admin-queries";
import type { MesaAdmin, ZonaAdmin } from "@/lib/restaurant/admin-types";
import { prefijoZona } from "@/lib/restaurant/mesa-label";
import { DownloadIcon, PlusIcon, RefreshIcon } from "@/components/icons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function pedirUrl(identificador: string): string {
  return `${SITE_URL}/pedir?mesa=${identificador}`;
}

function mensajeError(base: string, err: unknown): string {
  const detalle =
    err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : null;
  return detalle ? `${base} (${detalle})` : base;
}

export function MesasGestion() {
  const [mesas, setMesas] = useState<MesaAdmin[] | null>(null);
  const [zonas, setZonas] = useState<ZonaAdmin[]>([]);
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [nuevoNumero, setNuevoNumero] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaZonaId, setNuevaZonaId] = useState("");
  const [nuevaCapacidad, setNuevaCapacidad] = useState("4");
  const [nombreEditado, setNombreEditado] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const [data, zonasData] = await Promise.all([getMesasAdmin(), getZonasAdmin()]);
      setMesas(data);
      setZonas(zonasData);
      setNombreEditado(Object.fromEntries(data.map((m) => [m.id, m.nombre ?? ""])));
      const entries = await Promise.all(
        data.map(async (mesa) => [mesa.id, await QRCode.toDataURL(pedirUrl(mesa.identificador))] as const),
      );
      setQrs(Object.fromEntries(entries));
      setError(null);
    } catch (err) {
      setError(mensajeError("No se han podido cargar las mesas.", err));
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (!mensaje) return;
    const timeout = setTimeout(() => setMensaje(null), 4000);
    return () => clearTimeout(timeout);
  }, [mensaje]);

  const handleNuevaZonaChange = (zonaId: string) => {
    setNuevaZonaId(zonaId);
    setNuevoNumero((prev) => prev.replace(/^[A-Za-z]+/, ""));
  };

  const normalizarNumero = (numero: string, prefijo: string): string => {
    const trimmed = numero.trim();
    if (!prefijo) return trimmed;
    if (trimmed.toUpperCase().startsWith(prefijo)) return trimmed.toUpperCase();
    const resto = trimmed.replace(/^[A-Za-z]+/, "");
    return `${prefijo}${resto}`;
  };

  const handleCrear = async () => {
    const prefijo = prefijoZona(nuevaZonaId || null, zonas);
    const numero = normalizarNumero(nuevoNumero, prefijo);
    if (!numero) return;
    setError(null);
    try {
      const mesaCreada = await crearMesaAdmin(
        numero,
        nuevoNombre.trim(),
        nuevaZonaId || null,
        Number(nuevaCapacidad) || 4,
      );
      setNuevoNumero("");
      setNuevoNombre("");
      setNuevaCapacidad("4");
      await cargar();
      setMensaje(`Mesa ${mesaCreada.numero} creada correctamente.`);
    } catch (err) {
      setError(mensajeError("No se ha podido crear la mesa (¿ya existe ese número?).", err));
    }
  };

  const handleCambiarZona = async (mesa: MesaAdmin, zonaId: string) => {
    try {
      await actualizarMesaZonaAdmin(mesa.id, zonaId || null);
      await cargar();
    } catch (err) {
      setError(mensajeError("No se ha podido cambiar la zona.", err));
    }
  };

  const handleCambiarCapacidad = async (mesa: MesaAdmin, capacidad: string) => {
    const valor = Number(capacidad);
    if (!valor || valor <= 0 || valor === mesa.capacidad) return;
    try {
      await actualizarMesaCapacidadAdmin(mesa.id, valor);
      await cargar();
    } catch (err) {
      setError(mensajeError("No se ha podido cambiar el aforo.", err));
    }
  };

  const handleGuardarNombre = async (mesa: MesaAdmin) => {
    const nombre = (nombreEditado[mesa.id] ?? "").trim();
    if (nombre === (mesa.nombre ?? "")) return;
    try {
      await actualizarMesaNombreAdmin(mesa.id, nombre);
      await cargar();
    } catch (err) {
      setError(mensajeError("No se ha podido guardar el nombre.", err));
    }
  };

  const handleToggleActiva = async (mesa: MesaAdmin) => {
    try {
      await actualizarMesaActivaAdmin(mesa.id, !mesa.activa);
      await cargar();
    } catch (err) {
      setError(mensajeError("No se ha podido actualizar la mesa.", err));
    }
  };

  const handleRegenerar = async (mesa: MesaAdmin) => {
    if (!confirm("El QR impreso de esta mesa dejará de funcionar. ¿Continuar?")) return;
    try {
      await regenerarQrMesaAdmin(mesa.id);
      await cargar();
    } catch (err) {
      setError(mensajeError("No se ha podido regenerar el QR.", err));
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-noche-border bg-noche-surface p-4">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Número de mesa
          </label>
          <input
            type="text"
            value={nuevoNumero}
            onChange={(e) => setNuevoNumero(e.target.value)}
            placeholder="Ej: 1, T1, B2..."
            className="mt-1 w-24 rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Nombre (opcional)
          </label>
          <input
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Ej: Terraza 1, Barra..."
            className="mt-1 w-48 rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Zona</label>
          <select
            value={nuevaZonaId}
            onChange={(e) => handleNuevaZonaChange(e.target.value)}
            className="mt-1 w-40 rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
          >
            <option value="">Sin zona</option>
            {zonas.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Aforo</label>
          <input
            type="number"
            min={1}
            value={nuevaCapacidad}
            onChange={(e) => setNuevaCapacidad(e.target.value)}
            className="mt-1 w-20 rounded-lg border border-noche-border bg-noche-surface-2 px-3 py-2 text-sm text-noche-ink"
          />
        </div>
        <button
          type="button"
          onClick={handleCrear}
          className="flex items-center gap-1.5 rounded-lg bg-noche-primary px-4 py-2 text-xs uppercase tracking-widest2 text-noche-ink"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Crear mesa
        </button>
      </div>

      {mensaje ? (
        <div className="mt-3 rounded-lg border border-noche-positive/30 bg-noche-positive/10 px-3 py-2 text-sm text-noche-positive">
          {mensaje}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-noche-danger/30 bg-noche-danger/10 px-3 py-2 text-sm text-noche-danger">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => cargar()}
            className="flex items-center gap-1 text-xs uppercase tracking-widest2 underline"
          >
            <RefreshIcon className="h-3 w-3" />
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {mesas?.map((mesa) => (
          <div key={mesa.id} className="rounded-lg border border-noche-border bg-noche-surface p-4 text-center">
            <p className="font-display text-xl text-noche-ink">Mesa {mesa.numero}</p>

            {qrs[mesa.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrs[mesa.id]}
                alt={`QR de la mesa ${mesa.numero}`}
                className="mx-auto mt-3 h-32 w-32 rounded-lg bg-white p-1"
              />
            ) : (
              <div className="mx-auto mt-3 h-32 w-32 rounded-lg bg-noche-surface-2" />
            )}

            <p className="mt-2 text-xs uppercase tracking-widest2 text-noche-ink-muted">
              Escanea · Pide · Disfruta
            </p>

            <input
              value={nombreEditado[mesa.id] ?? ""}
              onChange={(e) =>
                setNombreEditado((prev) => ({ ...prev, [mesa.id]: e.target.value }))
              }
              onBlur={() => handleGuardarNombre(mesa)}
              placeholder="Nombre (opcional)"
              className="mt-3 w-full rounded-lg border border-noche-border bg-noche-surface-2 px-2 py-1.5 text-center text-sm text-noche-ink"
            />

            <div className="mt-2 flex gap-1.5">
              <select
                value={mesa.zona_id ?? ""}
                onChange={(e) => handleCambiarZona(mesa, e.target.value)}
                className="w-2/3 rounded-lg border border-noche-border bg-noche-surface-2 px-2 py-1.5 text-center text-xs text-noche-ink"
              >
                <option value="">Sin zona</option>
                {zonas.map((zona) => (
                  <option key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                defaultValue={mesa.capacidad}
                onBlur={(e) => handleCambiarCapacidad(mesa, e.target.value)}
                title="Aforo"
                className="w-1/3 rounded-lg border border-noche-border bg-noche-surface-2 px-2 py-1.5 text-center text-xs text-noche-ink"
              />
            </div>

            <div className="mt-3 flex flex-col gap-1.5">
              {qrs[mesa.id] ? (
                <a
                  href={qrs[mesa.id]}
                  download={`mesa-${mesa.numero}-qr.png`}
                  className="flex items-center justify-center gap-1 text-xs uppercase tracking-widest2 text-noche-ink-muted hover:text-noche-primary"
                >
                  <DownloadIcon className="h-3 w-3" />
                  Descargar
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => handleToggleActiva(mesa)}
                className={`text-xs uppercase tracking-widest2 ${
                  mesa.activa ? "text-noche-positive" : "text-noche-ink-faint"
                }`}
              >
                {mesa.activa ? "Activa" : "Inactiva (activar)"}
              </button>
              <button
                type="button"
                onClick={() => handleRegenerar(mesa)}
                className="flex items-center justify-center gap-1 text-xs uppercase tracking-widest2 text-noche-ink-faint hover:text-noche-danger"
              >
                <RefreshIcon className="h-3 w-3" />
                Regenerar QR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

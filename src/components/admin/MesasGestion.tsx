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

  const handleCrear = async () => {
    const numero = Number(nuevoNumero);
    if (!numero || numero <= 0) return;
    try {
      await crearMesaAdmin(numero, nuevoNombre.trim(), nuevaZonaId || null, Number(nuevaCapacidad) || 4);
      setNuevoNumero("");
      setNuevoNombre("");
      setNuevaCapacidad("4");
      await cargar();
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
      <div className="flex flex-wrap items-end gap-3 border border-brand-black/10 bg-white p-4">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
            Número de mesa
          </label>
          <input
            type="number"
            value={nuevoNumero}
            onChange={(e) => setNuevoNumero(e.target.value)}
            className="mt-1 w-24 border border-brand-black/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
            Nombre (opcional)
          </label>
          <input
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Ej: Terraza 1, Barra..."
            className="mt-1 w-48 border border-brand-black/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">Zona</label>
          <select
            value={nuevaZonaId}
            onChange={(e) => setNuevaZonaId(e.target.value)}
            className="mt-1 w-40 border border-brand-black/20 px-3 py-2 text-sm"
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
          <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">Aforo</label>
          <input
            type="number"
            min={1}
            value={nuevaCapacidad}
            onChange={(e) => setNuevaCapacidad(e.target.value)}
            className="mt-1 w-20 border border-brand-black/20 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleCrear}
          className="bg-brand-black px-4 py-2 text-xs uppercase tracking-widest2 text-brand-cream"
        >
          Crear mesa
        </button>
      </div>

      {error ? (
        <div className="mt-3 flex items-center justify-between border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => cargar()}
            className="text-xs uppercase tracking-widest2 underline"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {mesas?.map((mesa) => (
          <div key={mesa.id} className="border border-brand-black/10 bg-white p-4 text-center">
            <p className="font-display text-xl">Mesa {mesa.numero}</p>

            {qrs[mesa.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrs[mesa.id]}
                alt={`QR de la mesa ${mesa.numero}`}
                className="mx-auto mt-3 h-32 w-32"
              />
            ) : (
              <div className="mx-auto mt-3 h-32 w-32 bg-brand-sand" />
            )}

            <p className="mt-2 text-xs uppercase tracking-widest2 text-brand-ink/50">
              Escanea · Pide · Disfruta
            </p>

            <input
              value={nombreEditado[mesa.id] ?? ""}
              onChange={(e) =>
                setNombreEditado((prev) => ({ ...prev, [mesa.id]: e.target.value }))
              }
              onBlur={() => handleGuardarNombre(mesa)}
              placeholder="Nombre (opcional)"
              className="mt-3 w-full border border-brand-black/20 px-2 py-1.5 text-center text-sm"
            />

            <div className="mt-2 flex gap-1.5">
              <select
                value={mesa.zona_id ?? ""}
                onChange={(e) => handleCambiarZona(mesa, e.target.value)}
                className="w-2/3 border border-brand-black/20 px-2 py-1.5 text-center text-xs"
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
                className="w-1/3 border border-brand-black/20 px-2 py-1.5 text-center text-xs"
              />
            </div>

            <div className="mt-3 flex flex-col gap-1.5">
              {qrs[mesa.id] ? (
                <a
                  href={qrs[mesa.id]}
                  download={`mesa-${mesa.numero}-qr.png`}
                  className="text-xs uppercase tracking-widest2 text-brand-ink/70 hover:text-brand-pink"
                >
                  Descargar
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => handleToggleActiva(mesa)}
                className={`text-xs uppercase tracking-widest2 ${
                  mesa.activa ? "text-green-700" : "text-brand-ink/40"
                }`}
              >
                {mesa.activa ? "Activa" : "Inactiva (activar)"}
              </button>
              <button
                type="button"
                onClick={() => handleRegenerar(mesa)}
                className="text-xs uppercase tracking-widest2 text-brand-ink/40 hover:text-red-600"
              >
                Regenerar QR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

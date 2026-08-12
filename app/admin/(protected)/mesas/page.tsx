"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  actualizarMesaActivaAdmin,
  actualizarMesaNombreAdmin,
  crearMesaAdmin,
  getMesasAdmin,
  regenerarQrMesaAdmin,
} from "@/lib/restaurant/admin-queries";
import type { MesaAdmin } from "@/lib/restaurant/admin-types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function pedirUrl(identificador: string): string {
  return `${SITE_URL}/pedir?mesa=${identificador}`;
}

export default function MesasAdminPage() {
  const [mesas, setMesas] = useState<MesaAdmin[] | null>(null);
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [nuevoNumero, setNuevoNumero] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nombreEditado, setNombreEditado] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const data = await getMesasAdmin();
      setMesas(data);
      setNombreEditado(Object.fromEntries(data.map((m) => [m.id, m.nombre ?? ""])));
      const entries = await Promise.all(
        data.map(async (mesa) => [mesa.id, await QRCode.toDataURL(pedirUrl(mesa.identificador))] as const),
      );
      setQrs(Object.fromEntries(entries));
    } catch {
      setError("No se han podido cargar las mesas.");
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleCrear = async () => {
    const numero = Number(nuevoNumero);
    if (!numero || numero <= 0) return;
    try {
      await crearMesaAdmin(numero, nuevoNombre.trim());
      setNuevoNumero("");
      setNuevoNombre("");
      await cargar();
    } catch {
      setError("No se ha podido crear la mesa (¿ya existe ese número?).");
    }
  };

  const handleGuardarNombre = async (mesa: MesaAdmin) => {
    const nombre = (nombreEditado[mesa.id] ?? "").trim();
    if (nombre === (mesa.nombre ?? "")) return;
    try {
      await actualizarMesaNombreAdmin(mesa.id, nombre);
      await cargar();
    } catch {
      setError("No se ha podido guardar el nombre.");
    }
  };

  const handleToggleActiva = async (mesa: MesaAdmin) => {
    try {
      await actualizarMesaActivaAdmin(mesa.id, !mesa.activa);
      await cargar();
    } catch {
      setError("No se ha podido actualizar la mesa.");
    }
  };

  const handleRegenerar = async (mesa: MesaAdmin) => {
    if (!confirm("El QR impreso de esta mesa dejará de funcionar. ¿Continuar?")) return;
    try {
      await regenerarQrMesaAdmin(mesa.id);
      await cargar();
    } catch {
      setError("No se ha podido regenerar el QR.");
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl">Mesas</h1>

      <div className="mt-6 flex flex-wrap items-end gap-3 border border-brand-black/10 bg-white p-4">
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
        <button
          type="button"
          onClick={handleCrear}
          className="bg-brand-black px-4 py-2 text-xs uppercase tracking-widest2 text-brand-cream"
        >
          Crear mesa
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

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

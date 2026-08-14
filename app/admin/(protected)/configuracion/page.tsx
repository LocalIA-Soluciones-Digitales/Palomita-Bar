"use client";

import { useEffect, useState } from "react";
import { getConfiguracionAdmin, setConfiguracionAdmin } from "@/lib/restaurant/admin-queries";
import { CamarerosGestion } from "@/components/admin/CamarerosGestion";

export default function ConfiguracionAdminPage() {
  const [horario, setHorario] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getConfiguracionAdmin()
      .then((valor) => setHorario(valor ?? ""))
      .catch(() => setError("No se ha podido cargar la configuración."))
      .finally(() => setCargando(false));
  }, []);

  const handleGuardar = async () => {
    setGuardando(true);
    setGuardado(false);
    setError(null);
    try {
      await setConfiguracionAdmin(horario);
      setGuardado(true);
    } catch {
      setError("No se ha podido guardar.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <p className="text-sm text-brand-ink/50">Cargando…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl">Configuración</h1>

      <div className="mt-6 border border-brand-black/10 bg-white p-4">
        <label className="text-xs uppercase tracking-widest2 text-brand-ink/50">
          Horario (se muestra en /contacto)
        </label>
        <textarea
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          rows={4}
          placeholder="Ej: Martes a domingo, 18:00 - 01:00"
          className="mt-1 w-full border border-brand-black/20 px-3 py-2 text-sm"
        />

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {guardado ? <p className="mt-2 text-sm text-green-700">Guardado.</p> : null}

        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="mt-4 bg-brand-black px-4 py-2 text-xs uppercase tracking-widest2 text-brand-cream disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>

      <CamarerosGestion />
    </div>
  );
}

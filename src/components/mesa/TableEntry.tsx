"use client";

import { useState, type ReactNode } from "react";
import { useTableSession } from "@/components/mesa/table-session-context";

export function TableEntry({ children }: { children: ReactNode }) {
  const { sesion, sesionPublica, loading, error, canOrder, elegirModo, identificarse } =
    useTableSession();
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [nombreEligiendo, setNombreEligiendo] = useState<string | null>(null);

  const elegirExistente = async (nombreExistente: string) => {
    setNombreEligiendo(nombreExistente);
    await identificarse(nombreExistente);
    setNombreEligiendo(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-noche-ink-muted">
        Cargando mesa…
      </div>
    );
  }

  if (canOrder) {
    return <>{children}</>;
  }

  if (!sesion) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-widest2 text-noche-primary">Bienvenido</p>
        <h1 className="mt-3 font-display text-3xl text-noche-ink">¿Cómo vais a pedir?</h1>
        <p className="mt-3 text-sm text-noche-ink-muted">
          Podéis compartir un único pedido para toda la mesa o pedir cada uno por su cuenta y
          pagar solo vuestra parte.
        </p>

        <div className="mt-10 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => elegirModo("JUNTOS")}
            className="border border-noche-border bg-noche-surface px-6 py-5 text-left transition-colors hover:border-noche-primary"
          >
            <p className="font-display text-xl text-noche-ink">Pedimos juntos</p>
            <p className="mt-1 text-sm text-noche-ink-muted">
              Un único pedido y una única cuenta para toda la mesa.
            </p>
          </button>

          <button
            type="button"
            onClick={() => elegirModo("SEPARADO")}
            className="border border-noche-border bg-noche-surface px-6 py-5 text-left transition-colors hover:border-noche-primary"
          >
            <p className="font-display text-xl text-noche-ink">Cada uno por separado</p>
            <p className="mt-1 text-sm text-noche-ink-muted">
              Cada comensal pide y paga su parte. Podéis compartir platos entre varios.
            </p>
          </button>
        </div>

        {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
      </div>
    );
  }

  // sesion.modo === "SEPARADO" && sin participante todavía
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-widest2 text-noche-primary">Casi listo</p>
      <h1 className="mt-3 font-display text-3xl text-noche-ink">¿Cómo te llamamos?</h1>
      <p className="mt-3 text-sm text-noche-ink-muted">
        Así el resto de la mesa sabrá qué has pedido y podréis compartir platos.
      </p>

      {sesionPublica && sesionPublica.participantes.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            ¿Eres alguno de estos?
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {sesionPublica.participantes.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => elegirExistente(p.nombre)}
                disabled={nombreEligiendo !== null}
                className="border border-noche-border bg-noche-surface px-4 py-2 text-sm text-noche-ink transition-colors hover:border-noche-primary disabled:opacity-50"
              >
                {nombreEligiendo === p.nombre ? "…" : p.nombre}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-noche-ink-muted">O dinos tu nombre si eres nuevo:</p>
        </div>
      ) : null}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const value = nombre.trim();
          if (!value) return;
          setEnviando(true);
          await identificarse(value.slice(0, 40));
          setEnviando(false);
        }}
        className="mt-8 flex flex-col gap-3"
      >
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={40}
          placeholder="Tu nombre"
          autoFocus
          className="border border-noche-border bg-noche-surface px-4 py-3 text-center text-noche-ink placeholder:text-noche-ink-muted"
        />
        <button
          type="submit"
          disabled={enviando || nombre.trim() === ""}
          className="bg-noche-primary py-3 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-noche-primary-dark disabled:opacity-50"
        >
          {enviando ? "Un momento…" : "Empezar a pedir"}
        </button>
      </form>

      {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

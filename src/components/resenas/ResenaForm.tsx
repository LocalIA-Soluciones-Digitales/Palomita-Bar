"use client";

import { useState, type FormEvent } from "react";
import { crearResenaPublica } from "@/lib/restaurant/queries";
import { errorMessage } from "@/lib/format";
import { SITE } from "@/lib/constants";
import { CheckIcon, StarIcon } from "@/components/icons";

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="mt-1 flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          className="p-0.5"
        >
          <StarIcon
            className={`h-7 w-7 ${
              (hover || value) >= n ? "text-noche-primary" : "text-noche-ink-faint"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ResenaForm() {
  const [nombre, setNombre] = useState("");
  const [valoracion, setValoracion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (valoracion < 1) {
      setError("Selecciona una puntuación de 1 a 5 estrellas.");
      return;
    }
    setEnviando(true);
    try {
      await crearResenaPublica({ nombre, valoracion, comentario });
      setEnviado(true);
    } catch (err) {
      setError(errorMessage(err) || "No hemos podido registrar tu opinión. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="rounded-lg border border-noche-positive/40 bg-noche-positive/10 p-6 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-noche-positive/20 text-noche-positive">
          <CheckIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-display text-xl text-noche-ink">Gracias por tu opinión</p>
        <p className="mt-1 text-sm text-noche-ink-muted">
          La revisaremos antes de publicarla en la web.
        </p>
        <a
          href={SITE.googleReviewsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center rounded-full border border-noche-ink/30 px-6 py-3 text-sm font-medium text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
        >
          Publícala también en Google
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Nombre</span>
        <input
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={100}
          className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-noche-ink"
        />
      </label>

      <div>
        <span className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Puntuación</span>
        <RatingInput value={valoracion} onChange={setValoracion} />
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest2 text-noche-ink-muted">Tu opinión</span>
        <textarea
          required
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Cuéntanos qué tal tu experiencia…"
          className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface px-4 py-3 text-noche-ink"
        />
      </label>

      {error ? <p className="text-sm text-noche-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-noche-primary py-4 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-noche-primary-dark disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Enviar opinión"}
      </button>
    </form>
  );
}

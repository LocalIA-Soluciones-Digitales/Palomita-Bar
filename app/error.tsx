"use client";

import { useEffect } from "react";
import Link from "next/link";
import { crearErrorLog } from "@/lib/restaurant/queries";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    crearErrorLog({
      message: error.message || "Error desconocido",
      stack: error.stack,
      source: "web",
      url: typeof window === "undefined" ? undefined : window.location.href,
    }).catch(() => {
      // Si ni siquiera se puede registrar el error, no hay más que hacer aquí.
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-widest2 text-noche-primary">Palomita Bar</p>
      <h1 className="mt-4 font-display text-2xl text-noche-ink">Algo ha ido mal</h1>
      <p className="mt-2 text-sm text-noche-ink-muted">
        Hemos registrado el error. Prueba a recargar la página.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-full bg-noche-primary px-5 py-2.5 text-sm font-medium text-white"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

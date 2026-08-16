"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email o contraseña incorrectos.");
      setSubmitting(false);
      return;
    }

    router.replace("/admin/cocina");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-24">
      <Link
        href="/"
        className="text-xs uppercase tracking-widest2 text-noche-ink-muted transition-colors hover:text-noche-primary"
      >
        ← Volver al inicio
      </Link>
      <p className="mt-6 text-xs uppercase tracking-widest2 text-noche-primary">Palomita</p>
      <h1 className="mt-4 font-display text-3xl text-noche-ink">Acceso equipo</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="text-xs uppercase tracking-widest2 text-noche-ink-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface px-3 py-2.5 text-sm text-noche-ink outline-none focus:border-noche-primary"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-xs uppercase tracking-widest2 text-noche-ink-muted"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-noche-border bg-noche-surface px-3 py-2.5 text-sm text-noche-ink outline-none focus:border-noche-primary"
          />
        </div>

        {error ? <p className="text-sm text-noche-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-noche-primary py-3 text-sm uppercase tracking-widest2 text-noche-ink transition-colors hover:bg-noche-primary-dark disabled:opacity-50"
        >
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

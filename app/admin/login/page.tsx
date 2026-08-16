"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AlertIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, RefreshIcon } from "@/components/icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-noche-primary/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-noche-accent/20 blur-[100px]"
      />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest2 text-noche-ink-faint transition-colors hover:text-noche-primary"
        >
          ← Volver al inicio
        </Link>

        <div className="mt-6 rounded-2xl border border-noche-border bg-noche-surface/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-noche-primary/30 bg-noche-primary/10">
              <span className="font-display text-xl text-noche-primary">P</span>
            </div>
            <p className="mt-4 text-xs uppercase tracking-widest2 text-noche-primary">
              Palomita Bar
            </p>
            <h1 className="mt-1 font-display text-2xl text-noche-ink">Acceso equipo</h1>
            <p className="mt-1 text-xs text-noche-ink-faint">
              Panel privado — solo personal autorizado
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-xs uppercase tracking-widest2 text-noche-ink-muted"
              >
                Email
              </label>
              <div className="relative mt-1.5">
                <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-noche-ink-faint" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-noche-border bg-noche-surface-2 py-2.5 pl-10 pr-3 text-sm text-noche-ink outline-none transition-colors focus:border-noche-primary"
                  placeholder="tú@palomitabar.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-xs uppercase tracking-widest2 text-noche-ink-muted"
              >
                Contraseña
              </label>
              <div className="relative mt-1.5">
                <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-noche-ink-faint" />
                <input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-noche-border bg-noche-surface-2 py-2.5 pl-10 pr-10 text-sm text-noche-ink outline-none transition-colors focus:border-noche-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-noche-ink-faint transition-colors hover:text-noche-ink"
                >
                  {mostrarPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-noche-danger/30 bg-noche-danger/10 px-3 py-2.5 text-sm text-noche-danger">
                <AlertIcon className="h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-noche-primary py-3 text-sm font-medium uppercase tracking-widest2 text-white transition-colors hover:bg-noche-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshIcon className="h-4 w-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-noche-ink-faint">
          ¿Problemas para acceder? Contacta con quien gestiona el panel de Palomita Bar.
        </p>
      </div>
    </div>
  );
}

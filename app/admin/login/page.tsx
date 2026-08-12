"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
      <p className="text-xs uppercase tracking-widest2 text-brand-pink">Palomita</p>
      <h1 className="mt-4 font-display text-3xl">Acceso equipo</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="text-xs uppercase tracking-widest2 text-brand-ink/50">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full border border-brand-black/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-pink"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-xs uppercase tracking-widest2 text-brand-ink/50"
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
            className="mt-1 w-full border border-brand-black/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-pink"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-black py-3 text-sm uppercase tracking-widest2 text-brand-cream transition-colors hover:bg-brand-pink disabled:opacity-50"
        >
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export function HeroSection({ image }: { image: string | null }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden bg-noche-bg px-6 pb-20 pt-32">
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-noche-bg via-noche-bg/60 to-noche-bg/20" />
      <div className="absolute inset-0 bg-noche-bg/20" />

      <div
        className={`relative mx-auto w-full max-w-6xl transition-all duration-700 ${
          loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <p className="text-xs uppercase tracking-widest2 text-noche-primary">Barakaldo</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.95] text-noche-ink sm:text-8xl">
          Palomita
        </h1>
        <p className="mt-6 max-w-md text-lg text-noche-ink/80">
          {SITE.tagline}. Picoteo con guiño japonés, cócteles de autor y barra abierta hasta
          tarde.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/carta"
            className="inline-flex items-center border border-noche-ink/30 px-6 py-3 text-sm uppercase tracking-widest2 text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
          >
            Ver carta
          </Link>
          <Link
            href="/pedir"
            className="inline-flex items-center bg-noche-primary px-6 py-3 text-sm uppercase tracking-widest2 text-white transition-colors hover:bg-noche-primary-dark"
          >
            Pedir en mesa
          </Link>
        </div>
      </div>

      <a
        href="#nosotros"
        aria-label="Descubre más"
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-noche-ink/60 transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="block animate-bounce text-2xl">↓</span>
      </a>
    </section>
  );
}

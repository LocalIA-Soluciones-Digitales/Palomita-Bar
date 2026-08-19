"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { QrCodeIcon } from "@/components/icons";

export function HeroSection({ image }: { image: string | null }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden bg-noche-bg px-6 pb-20 pt-32">
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
      {/* Velo del hero: oscuro en modo noche, crema cálido en modo día (ver
          --hero-scrim-* en globals.css). El texto usa noche-ink, que ya se
          adapta solo: casi blanco de noche, oscuro de día — coherente con
          el tono de cada velo. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to top, var(--hero-scrim-a), var(--hero-scrim-b), var(--hero-scrim-c))",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--hero-vignette), transparent, var(--hero-vignette))",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <Image
          src="/images/logo-palomita.png"
          alt="Palomita Bar"
          width={594}
          height={507}
          priority
          className={`h-28 w-auto drop-shadow-[0_0_36px_rgba(210,67,173,0.55)] transition-all duration-1000 sm:h-36 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "0ms" }}
        />
        <h1
          className={`mt-4 font-display text-5xl leading-[0.95] text-noche-ink transition-all duration-1000 sm:text-7xl ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "120ms" }}
        >
          Palomita Bar
        </h1>
        <div
          className={`mt-5 flex items-center gap-3 text-xs uppercase tracking-widest2 text-noche-primary transition-all duration-1000 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "250ms" }}
        >
          <span className="h-px w-8 bg-noche-primary/50" />
          Coctelería &amp; Picoteo
          <span className="h-px w-8 bg-noche-primary/50" />
        </div>
        <p
          className={`mt-6 max-w-md text-lg text-noche-ink/80 transition-all duration-1000 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "300ms" }}
        >
          {SITE.tagline}. Picoteo con guiño japonés, cócteles de autor y barra abierta hasta
          tarde.
        </p>

        <div
          className={`mt-10 flex flex-wrap justify-center gap-4 transition-all duration-1000 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "450ms" }}
        >
          <Link
            href="/carta"
            className="inline-flex items-center rounded-full bg-noche-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-noche-primary-dark"
          >
            Ver carta
          </Link>
          <Link
            href="/pedir"
            className="inline-flex items-center rounded-full border border-noche-ink/30 px-6 py-3 text-sm font-medium text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
          >
            Pedir en mesa
          </Link>
        </div>

        <p
          className={`mt-8 flex items-center gap-2 text-xs text-noche-ink-muted transition-all duration-1000 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <QrCodeIcon className="h-4 w-4" />
          Escanea el QR de tu mesa y descubre nuestra carta
        </p>
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

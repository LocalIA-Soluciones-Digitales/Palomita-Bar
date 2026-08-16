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
      {/* Velo fijo (no depende de --noche-bg): el hero siempre es texto claro
          sobre foto, en modo día y en modo noche por igual — si usara las
          variables de tema, en modo día el velo se aclara y "lava" la foto. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <h1
          className={`font-display text-5xl leading-[0.95] text-white transition-all duration-1000 sm:text-7xl ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "0ms" }}
        >
          Palomita Bar
        </h1>
        <div
          className={`mt-5 flex items-center gap-3 text-xs uppercase tracking-widest2 text-noche-primary transition-all duration-1000 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "150ms" }}
        >
          <span className="h-px w-8 bg-noche-primary/50" />
          Coctelería &amp; Picoteo
          <span className="h-px w-8 bg-noche-primary/50" />
        </div>
        <p
          className={`mt-6 max-w-md text-lg text-white/80 transition-all duration-1000 ${
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
            className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-noche-primary hover:text-noche-primary"
          >
            Pedir en mesa
          </Link>
        </div>

        <p
          className={`mt-8 flex items-center gap-2 text-xs text-white/70 transition-all duration-1000 ${
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
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="block animate-bounce text-2xl">↓</span>
      </a>
    </section>
  );
}

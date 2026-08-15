"use client";

import Image from "next/image";
import { SITE } from "@/lib/constants";
import { InstagramIcon } from "@/components/icons";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function AmbienceSection({ images }: { images: string[] }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  if (images.length === 0) return null;

  return (
    <section className="border-t border-noche-border bg-noche-bg px-6 py-28">
      <div
        ref={ref}
        className={`mx-auto max-w-6xl transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-3 text-xs uppercase tracking-widest2 text-noche-primary">
            <span className="h-px w-6 bg-noche-primary/50" />
            Síguenos
            <span className="h-px w-6 bg-noche-primary/50" />
          </p>
          <h2 className="mt-4 font-display text-4xl text-noche-ink">{SITE.instagram.handle}</h2>
          <p className="mt-4 text-noche-ink/70">
            Descubre nuestras creaciones, eventos y el ambiente de cada noche.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((src, index) => (
            <a
              key={src}
              href={SITE.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg bg-noche-surface"
            >
              <Image
                src={src}
                alt={`Ambiente de Palomita Bar ${index + 1}`}
                fill
                sizes="(min-width: 640px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-noche-bg/0 text-white opacity-0 transition-all duration-300 group-hover:bg-noche-bg/50 group-hover:opacity-100">
                <InstagramIcon className="h-7 w-7" />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={SITE.instagram.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-noche-ink/30 px-6 py-3 text-sm font-medium text-noche-ink transition-colors hover:border-noche-primary hover:text-noche-primary"
          >
            <InstagramIcon className="h-4 w-4" />
            Seguir en Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

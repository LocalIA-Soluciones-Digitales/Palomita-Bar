import Image from "next/image";
import { SITE } from "@/lib/constants";
import { InstagramIcon } from "@/components/icons";

export function AmbienceSection({ images }: { images: string[] }) {
  if (images.length === 0) return null;

  return (
    <section className="border-t border-noche-border bg-noche-bg px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-noche-primary">Ambiente</p>
            <h2 className="mt-4 font-display text-4xl text-noche-ink">Síguenos</h2>
          </div>
          <a
            href={SITE.instagram.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm uppercase tracking-widest2 text-noche-ink-muted transition-colors hover:text-noche-primary"
          >
            {SITE.instagram.handle}
          </a>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((src, index) => (
            <a
              key={src}
              href={SITE.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden bg-noche-surface"
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
      </div>
    </section>
  );
}

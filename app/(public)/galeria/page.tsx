import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Galería",
  description: "Galería de fotos de Palomita Bar, Barakaldo.",
};

const PHOTOS = [
  { src: "/images/galeria/bar-interior.jpg", alt: "Interior de un bar de coctelería" },
  { src: "/images/galeria/gyoza-dumplings.jpg", alt: "Gyozas al vapor" },
  { src: "/images/galeria/preparacion-cocktail.jpg", alt: "Preparación de un cóctel de autor" },
  { src: "/images/galeria/sushi-atun-aguacate.jpg", alt: "Roll de atún y aguacate" },
  { src: "/images/galeria/vaso-whisky.jpg", alt: "Copa sobre la barra" },
  { src: "/images/galeria/atun-tartar.jpg", alt: "Tartar de atún" },
  { src: "/images/galeria/barra-cocteles.jpg", alt: "Cócteles servidos en barra" },
  { src: "/images/galeria/sushi-variado.jpg", alt: "Selección de sushi y rolls" },
  { src: "/images/galeria/cocktail-detalle.jpg", alt: "Detalle de cóctel con guarnición" },
];

export default function GaleriaPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <p className="text-xs uppercase tracking-widest2 text-noche-primary">Galería</p>
      <h1 className="mt-4 font-display text-5xl text-noche-ink">En imágenes</h1>
      <p className="mt-4 max-w-lg text-noche-ink-muted">
        Ambiente de referencia mientras preparamos el reportaje fotográfico
        real de Palomita: local y carta.
      </p>

      <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PHOTOS.map((photo) => (
          <div
            key={photo.src}
            className="relative aspect-[4/5] overflow-hidden bg-noche-surface"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

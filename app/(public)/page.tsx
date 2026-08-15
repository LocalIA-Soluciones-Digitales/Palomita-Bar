import { getCarta, getCategorias, getHorarioPublico, getSiteImages } from "@/lib/restaurant/queries";
import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { CuratedSection } from "@/components/home/CuratedSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { AmbienceSection } from "@/components/home/AmbienceSection";
import { LocationSection } from "@/components/home/LocationSection";

export const revalidate = 60;

export default async function HomePage() {
  const [categorias, productos, siteImages, horario] = await Promise.all([
    getCategorias(),
    getCarta(),
    getSiteImages(),
    getHorarioPublico(),
  ]);

  const destacados = productos.filter((p) => p.destacado && p.disponible).slice(0, 6);

  return (
    <>
      <HeroSection image={siteImages?.hero ?? null} />
      <AboutSection image={siteImages?.about ?? null} />
      <CuratedSection productos={destacados} categorias={categorias} />
      <ReviewsSection />
      <AmbienceSection images={siteImages?.ambiente ?? []} />
      <LocationSection horario={horario} />
    </>
  );
}

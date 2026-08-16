import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ActiveOrderBanner } from "@/components/pedido/ActiveOrderBanner";
import { SITE } from "@/lib/constants";
import { getHorarioPublico } from "@/lib/restaurant/queries";
import { DIAS_SEMANA, parseHorario, semanaPorDefecto } from "@/lib/horario";

const DIA_SCHEMA_ORG: Record<(typeof DIAS_SEMANA)[number], string> = {
  Lunes: "Monday",
  Martes: "Tuesday",
  Miércoles: "Wednesday",
  Jueves: "Thursday",
  Viernes: "Friday",
  Sábado: "Saturday",
  Domingo: "Sunday",
};

// Script inline mínimo (sin dependencia de props ni datos de usuario) que
// aplica el tema guardado antes del primer paint, para que el toggle de
// ThemeToggle no provoque un parpadeo del tema oscuro al cargar la página.
const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("palomita.tema")==="dia"){document.documentElement.setAttribute("data-theme","dia")}}catch(e){}`;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let semana = semanaPorDefecto();
  try {
    const horario = await getHorarioPublico();
    semana = parseHorario(horario) ?? semanaPorDefecto();
  } catch {
    // Si la RPC falla, se mantiene el horario habitual publicado por defecto.
  }

  const openingHoursSpecification = semana
    .map((dia, index) => ({ dia, nombre: DIAS_SEMANA[index]! }))
    .filter(({ dia }) => dia.abierto)
    .map(({ dia, nombre }) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DIA_SCHEMA_ORG[nombre],
      opens: dia.desde,
      closes: dia.hasta,
    }));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: SITE.name,
    servesCuisine: ["Cocktails", "Tapas", "Japanese-influenced"],
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.line1,
      postalCode: SITE.address.postalCode,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.province,
      addressCountry: "ES",
    },
    telephone: SITE.phone,
    sameAs: [SITE.instagram.url],
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://palomitabar.es",
    openingHoursSpecification,
  };

  return (
    <div className="flex min-h-screen flex-col bg-noche-bg text-noche-ink">
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ActiveOrderBanner />
    </div>
  );
}

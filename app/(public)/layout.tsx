import { Cormorant_Garamond } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE } from "@/lib/constants";

// Tipografía propia de la web pública. Redefine la variable --font-display
// solo dentro de este layout (public), así que /admin sigue con Playfair
// Display (definida en app/layout.tsx) sin ningún cambio.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

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
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${cormorant.variable} flex min-h-screen flex-col bg-noche-bg text-noche-ink`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE } from "@/lib/constants";

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
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

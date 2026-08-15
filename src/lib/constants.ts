export const SITE = {
  name: "Palomita Bar",
  tagline: "Coctelería y picoteo en Barakaldo",
  address: {
    line1: "Gernikako Arbola Etorbidea 6A",
    postalCode: "48902",
    city: "Barakaldo",
    province: "Bizkaia",
  },
  phone: "+34 686 53 03 10",
  phoneHref: "tel:+34686530310",
  instagram: {
    handle: "@palomita_bar",
    url: "https://www.instagram.com/palomita_bar",
  },
  googleReviewsUrl: "https://www.google.com/search?q=Palomita+Bar+Barakaldo+reseñas",
  // Editable desde /admin/configuracion; este valor es el fallback si no hay horario en BD.
  hoursNote:
    "Lunes a jueves: 9:00–23:30\nViernes: 9:00–3:00\nSábado: 10:00–3:00\nDomingo: 10:00–23:00",
} as const;

export const NAV_LINKS = [
  { href: "/#nosotros", label: "Historia" },
  { href: "/carta", label: "Carta" },
  { href: "/cocteleria", label: "Coctelería" },
  { href: "/galeria", label: "Galería" },
  { href: "/contacto", label: "Contacto" },
] as const;

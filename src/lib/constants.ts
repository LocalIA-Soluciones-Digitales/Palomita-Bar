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
  // Horario provisional: pendiente de confirmar con el negocio.
  // Editable desde /admin/configuracion en fases posteriores.
  hoursNote: "Horario disponible próximamente",
} as const;

export const NAV_LINKS = [
  { href: "/historia", label: "Historia" },
  { href: "/carta", label: "Carta" },
  { href: "/cocteleria", label: "Coctelería" },
  { href: "/galeria", label: "Galería" },
  { href: "/contacto", label: "Contacto" },
] as const;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sin la optimización de Vercel: agotaba la cuota gratis de transformaciones
    // (5.000/mes) y, al pasarla, las fotos salen rotas. Las fotos ya son ligeras
    // (~40 KB de media en Supabase Storage).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

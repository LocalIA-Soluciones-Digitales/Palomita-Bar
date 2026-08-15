import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#E4007C",
          "pink-dark": "#B3005F",
          black: "#141110",
          ink: "#1F1B1A",
          cream: "#FAF7F2",
          sand: "#F1EAE0",
        },
        // Identidad oscura de la web pública (home, carta, coctelería,
        // historia, galería, contacto, flujo de pedido en mesa). El panel
        // /admin y /cocina siguen usando `brand.*` en claro, sin cambios.
        noche: {
          bg: "oklch(var(--noche-bg) / <alpha-value>)",
          surface: "oklch(var(--noche-surface) / <alpha-value>)",
          "surface-2": "oklch(var(--noche-surface-2) / <alpha-value>)",
          primary: "oklch(var(--noche-primary) / <alpha-value>)",
          "primary-dark": "oklch(var(--noche-primary-dark) / <alpha-value>)",
          accent: "oklch(var(--noche-accent) / <alpha-value>)",
          positive: "oklch(var(--noche-positive) / <alpha-value>)",
          warning: "oklch(var(--noche-warning) / <alpha-value>)",
          ink: "oklch(var(--noche-ink) / <alpha-value>)",
          "ink-muted": "oklch(var(--noche-ink-muted) / <alpha-value>)",
          border: "oklch(var(--noche-border) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      letterSpacing: {
        widest2: "0.2em",
      },
    },
  },
  plugins: [],
};

export default config;

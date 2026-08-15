import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identidad oscura única para toda la app: web pública (home, carta,
        // coctelería, historia, galería, contacto, flujo de pedido en mesa)
        // y panel /admin + /cocina.
        noche: {
          bg: "oklch(var(--noche-bg) / <alpha-value>)",
          surface: "oklch(var(--noche-surface) / <alpha-value>)",
          "surface-2": "oklch(var(--noche-surface-2) / <alpha-value>)",
          "surface-3": "oklch(var(--noche-surface-3) / <alpha-value>)",
          primary: "oklch(var(--noche-primary) / <alpha-value>)",
          "primary-dark": "oklch(var(--noche-primary-dark) / <alpha-value>)",
          accent: "oklch(var(--noche-accent) / <alpha-value>)",
          positive: "oklch(var(--noche-positive) / <alpha-value>)",
          warning: "oklch(var(--noche-warning) / <alpha-value>)",
          danger: "oklch(var(--noche-danger) / <alpha-value>)",
          ink: "oklch(var(--noche-ink) / <alpha-value>)",
          "ink-muted": "oklch(var(--noche-ink-muted) / <alpha-value>)",
          "ink-faint": "oklch(var(--noche-ink-faint) / <alpha-value>)",
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

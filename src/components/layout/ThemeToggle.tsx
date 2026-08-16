"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";

const STORAGE_KEY = "palomita.tema";

/**
 * La paleta "noche" está pensada para el ambiente nocturno del local, pero
 * la carta y el pedido en mesa también se usan a pleno sol en la terraza,
 * donde el texto claro sobre fondo oscuro es el peor escenario de
 * legibilidad. Este toggle cambia únicamente los valores de las variables
 * --noche-* (ver globals.css) sin tocar ningún componente: todo lo que usa
 * las clases bg-noche-... / text-noche-... se adapta solo.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [tema, setTema] = useState<"noche" | "dia" | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setTema(stored === "dia" ? "dia" : "noche");
  }, []);

  const alternar = () => {
    const siguiente = tema === "dia" ? "noche" : "dia";
    setTema(siguiente);
    window.localStorage.setItem(STORAGE_KEY, siguiente);
    if (siguiente === "dia") {
      document.documentElement.setAttribute("data-theme", "dia");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  if (tema === null) return null;

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === "dia" ? "Cambiar a modo noche" : "Cambiar a modo día (más legible al sol)"}
      title={tema === "dia" ? "Modo noche" : "Modo día"}
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-full border border-noche-border text-noche-ink-muted transition-colors hover:border-noche-primary hover:text-noche-primary"
      }
    >
      {tema === "dia" ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
    </button>
  );
}

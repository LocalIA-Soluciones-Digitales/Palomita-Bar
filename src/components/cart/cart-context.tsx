"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Producto } from "@/lib/restaurant/types";

export interface CartLine {
  producto: Producto;
  cantidad: number;
  notas?: string;
  /** Ids de otros comensales con los que se comparte esta línea (modo "separado"). */
  compartidoCon: string[];
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (producto: Producto) => void;
  removeItem: (productoId: string) => void;
  increment: (productoId: string) => void;
  decrement: (productoId: string) => void;
  toggleShare: (productoId: string, participanteId: string) => void;
  applyCatalog: (catalogo: Producto[]) => void;
  clear: () => void;
  totalCentimos: number;
  totalItems: number;
  /** true en cuanto se ha intentado leer el carrito guardado en localStorage
   * (aunque no hubiera nada que leer). Útil para no pisar un carrito
   * recién restaurado con una adición automática (p. ej. "pedir otra vez"). */
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_PREFIX = "palomita:carrito:";
// El carrito guardado se descarta pasado este tiempo: evita reabrir, horas o
// días después, un pedido con precios/disponibilidad ya caducados.
const MAX_EDAD_MS = 6 * 60 * 60 * 1000;

interface StoredCart {
  savedAt: number;
  lines: CartLine[];
}

function storageKey(mesaIdentificador?: string) {
  return `${STORAGE_PREFIX}${mesaIdentificador ?? "prueba"}`;
}

function leerCarritoGuardado(mesaIdentificador?: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(mesaIdentificador));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCart;
    if (!parsed || !Array.isArray(parsed.lines)) return [];
    if (Date.now() - parsed.savedAt > MAX_EDAD_MS) return [];
    return parsed.lines;
  } catch {
    return [];
  }
}

function escribirCarritoGuardado(mesaIdentificador: string | undefined, lines: CartLine[]) {
  if (typeof window === "undefined") return;
  try {
    const key = storageKey(mesaIdentificador);
    if (lines.length === 0) {
      window.localStorage.removeItem(key);
      return;
    }
    const data: StoredCart = { savedAt: Date.now(), lines };
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota llena, etc.)
  }
}

export function CartProvider({
  mesaIdentificador,
  children,
}: {
  /** Identificador de mesa usado solo para aislar el carrito guardado de otras mesas en el mismo dispositivo. */
  mesaIdentificador?: string;
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const hidratado = useRef(false);

  // Hidrata desde localStorage tras el primer render (evita desajustes de
  // SSR/hidratación: el servidor siempre renderiza el carrito vacío).
  useEffect(() => {
    const guardado = leerCarritoGuardado(mesaIdentificador);
    if (guardado.length > 0) setLines(guardado);
    hidratado.current = true;
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hidratado.current) return;
    escribirCarritoGuardado(mesaIdentificador, lines);
  }, [lines, mesaIdentificador]);

  const addItem = (producto: Producto) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.producto.id === producto.id);
      if (existing) {
        return prev.map((l) =>
          l.producto.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l,
        );
      }
      return [...prev, { producto, cantidad: 1, compartidoCon: [] }];
    });
  };

  const removeItem = (productoId: string) => {
    setLines((prev) => prev.filter((l) => l.producto.id !== productoId));
  };

  const increment = (productoId: string) => {
    setLines((prev) =>
      prev.map((l) => (l.producto.id === productoId ? { ...l, cantidad: l.cantidad + 1 } : l)),
    );
  };

  const decrement = (productoId: string) => {
    setLines((prev) =>
      prev
        .map((l) => (l.producto.id === productoId ? { ...l, cantidad: l.cantidad - 1 } : l))
        .filter((l) => l.cantidad > 0),
    );
  };

  const toggleShare = (productoId: string, participanteId: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.producto.id !== productoId) return l;
        const compartidoCon = l.compartidoCon.includes(participanteId)
          ? l.compartidoCon.filter((id) => id !== participanteId)
          : [...l.compartidoCon, participanteId];
        return { ...l, compartidoCon };
      }),
    );
  };

  const clear = () => setLines([]);

  /** Sustituye cada línea por su versión viva del catálogo (precio, disponibilidad…);
   * quita las que ya no están disponibles. Se usa justo antes de confirmar, para no
   * fiarse nunca del precio que quedó cacheado en el navegador. */
  const applyCatalog = (catalogo: Producto[]) => {
    setLines((prev) =>
      prev
        .map((l) => {
          const fresco = catalogo.find((p) => p.id === l.producto.id);
          return fresco && fresco.disponible ? { ...l, producto: fresco } : null;
        })
        .filter((l): l is CartLine => l !== null),
    );
  };

  const totalCentimos = useMemo(
    () => lines.reduce((sum, l) => sum + l.producto.precio_centimos * l.cantidad, 0),
    [lines],
  );
  const totalItems = useMemo(() => lines.reduce((sum, l) => sum + l.cantidad, 0), [lines]);

  return (
    <CartContext.Provider
      value={{
        lines,
        addItem,
        removeItem,
        increment,
        decrement,
        toggleShare,
        applyCatalog,
        clear,
        totalCentimos,
        totalItems,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de <CartProvider>");
  }
  return ctx;
}

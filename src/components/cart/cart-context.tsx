"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
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
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

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

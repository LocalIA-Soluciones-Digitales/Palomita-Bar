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

"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { formatCentimos } from "@/lib/format";
import { CartSheet } from "@/components/pedir/CartSheet";

export function CartBar({ mesaIdentificador }: { mesaIdentificador?: string }) {
  const { totalItems, totalCentimos } = useCart();
  const [open, setOpen] = useState(false);

  if (totalItems === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between bg-brand-black px-5 py-4 text-brand-cream shadow-lg sm:inset-x-auto sm:right-6 sm:w-96"
      >
        <span className="text-sm">
          🛒 {totalItems} {totalItems === 1 ? "producto" : "productos"}
        </span>
        <span className="text-sm font-medium">{formatCentimos(totalCentimos)} €</span>
      </button>

      {open ? (
        <CartSheet mesaIdentificador={mesaIdentificador} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

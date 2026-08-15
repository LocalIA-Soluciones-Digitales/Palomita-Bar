"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { formatCentimos } from "@/lib/format";
import { CartDrawer } from "@/components/pedir/CartDrawer";

export function CartBar({ mesaIdentificador }: { mesaIdentificador?: string }) {
  const { totalItems, totalCentimos } = useCart();
  const [open, setOpen] = useState(false);

  if (totalItems === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between bg-noche-primary px-5 py-4 text-white shadow-lg shadow-noche-bg/40 sm:inset-x-auto sm:right-6 sm:w-96"
      >
        <span className="text-sm">
          {totalItems} {totalItems === 1 ? "producto" : "productos"}
        </span>
        <span className="text-sm font-medium">{formatCentimos(totalCentimos)} €</span>
      </button>

      {open ? (
        <CartDrawer mesaIdentificador={mesaIdentificador} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

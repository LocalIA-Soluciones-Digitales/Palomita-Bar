"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { formatCentimos } from "@/lib/format";
import { CartDrawer } from "@/components/pedir/CartDrawer";
import { PhoneIcon } from "@/components/icons";
import { SITE } from "@/lib/constants";

export function CartBar({ mesaIdentificador }: { mesaIdentificador?: string }) {
  const { totalItems, totalCentimos } = useCart();
  const [open, setOpen] = useState(false);

  if (totalItems === 0) {
    return (
      <div className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between gap-3 rounded-full border border-noche-border bg-noche-surface/95 px-5 py-3 text-sm shadow-lg shadow-noche-bg/40 backdrop-blur-md sm:inset-x-auto sm:right-6 sm:w-96">
        <span className="font-display text-base text-noche-ink">{SITE.name}</span>
        <a
          href={SITE.phoneHref}
          className="flex items-center gap-1.5 text-noche-primary transition-colors hover:text-noche-primary-dark"
        >
          <PhoneIcon className="h-4 w-4" />
          {SITE.phone}
        </a>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-full bg-noche-primary px-5 py-4 text-white shadow-lg shadow-noche-bg/40 transition-colors hover:bg-noche-primary-dark sm:inset-x-auto sm:right-6 sm:w-96"
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

"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/constants";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        className="flex h-11 w-11 items-center justify-center"
      >
        <span className="relative block h-4 w-6">
          <span
            className={`absolute left-0 top-0 h-px w-6 bg-brand-black transition-transform ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 h-px w-6 -translate-y-1/2 bg-brand-black transition-opacity ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute bottom-0 left-0 h-px w-6 bg-brand-black transition-transform ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full border-t border-brand-black/10 bg-brand-cream px-6 py-8">
          <nav className="flex flex-col gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-display text-2xl"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/pedir"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex w-fit items-center bg-brand-pink px-6 py-3 text-sm uppercase tracking-widest2 text-white"
            >
              Pedir
            </Link>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="text-xs uppercase tracking-widest2 text-brand-ink/40"
            >
              Equipo
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

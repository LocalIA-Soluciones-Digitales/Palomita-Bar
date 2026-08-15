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
            className={`absolute left-0 top-0 h-px w-6 bg-noche-ink transition-transform ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 h-px w-6 -translate-y-1/2 bg-noche-ink transition-opacity ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute bottom-0 left-0 h-px w-6 bg-noche-ink transition-transform ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 top-16 z-30 flex flex-col bg-noche-bg/98 px-6 py-10 backdrop-blur-lg">
          <nav className="flex flex-col gap-7">
            {NAV_LINKS.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: `${index * 40}ms` }}
                className="font-display text-3xl text-noche-ink transition-colors hover:text-noche-primary"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/pedir"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex w-fit items-center bg-noche-primary px-6 py-3 text-sm uppercase tracking-widest2 text-white"
            >
              Pedir
            </Link>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="text-xs uppercase tracking-widest2 text-noche-ink-muted"
            >
              Equipo
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

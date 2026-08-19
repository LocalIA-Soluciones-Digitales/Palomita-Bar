"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NAV_LINKS } from "@/lib/constants";

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    // `position: fixed` on <body> breaks backdrop-filter compositing on
    // descendant fixed elements in Safari/iOS, so lock scroll with
    // overflow instead.
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
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

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 top-16 z-30 flex flex-col items-center overflow-y-auto bg-noche-bg/90 px-6 py-10 text-center backdrop-blur-2xl md:hidden">
              <Image
                src="/images/logo-palomita.png"
                alt="Palomita Bar"
                width={94}
                height={80}
                className="mb-8 h-14 w-auto drop-shadow-[0_0_28px_rgba(210,67,173,0.5)]"
              />
              <nav className="flex flex-col items-center gap-7">
                {NAV_LINKS.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => onOpenChange(false)}
                    style={{ transitionDelay: `${index * 40}ms` }}
                    className="font-display text-3xl text-noche-ink transition-colors hover:text-noche-primary"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/pedir"
                  onClick={() => onOpenChange(false)}
                  className="mt-4 inline-flex w-fit items-center rounded-full bg-noche-primary px-6 py-3 text-sm font-medium text-white"
                >
                  Pedir
                </Link>
                <Link
                  href="/admin/login"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex w-fit items-center rounded-full border border-noche-border px-6 py-3 text-sm font-medium text-noche-ink/80"
                >
                  Panel de gestión
                </Link>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

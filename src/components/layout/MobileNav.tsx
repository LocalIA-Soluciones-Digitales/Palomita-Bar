"use client";

import Link from "next/link";
import { useEffect } from "react";
import { NAV_LINKS } from "@/lib/constants";

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollY);
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

      {open ? (
        <div className="fixed inset-0 top-16 z-30 flex flex-col overflow-y-auto bg-noche-bg/95 px-6 py-10 backdrop-blur-2xl">
          <nav className="flex flex-col gap-7">
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
        </div>
      ) : null}
    </div>
  );
}

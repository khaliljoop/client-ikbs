"use client";

import Link from "next/link";
import { useState } from "react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="
          rounded-lg
          border border-ikbs-border
          bg-ikbs-card
          px-3
          py-2
          text-foreground
          transition
          hover:border-ikbs-primary
        "
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <div
          className="
            absolute
            left-0
            right-0
            top-full
            border-b
            border-ikbs-border
            bg-ikbs-card
            shadow-lg
          "
        >
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-4 sm:px-6">
            <Link
              href="/"
              onClick={closeMenu}
              className="rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-ikbs-primary/10"
            >
              Accueil
            </Link>

            <Link
              href="/services"
              onClick={closeMenu}
              className="rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-ikbs-primary/10"
            >
              Services
            </Link>

            <Link
              href="/organisations"
              onClick={closeMenu}
              className="rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-ikbs-primary/10"
            >
              Organisations
            </Link>

            <Link
              href="/login"
              onClick={closeMenu}
              className="
                mt-2
                rounded-lg
                bg-ikbs-primary
                px-4
                py-3
                text-center
                text-sm
                font-semibold
                text-white
                hover:bg-ikbs-primary-dark
              "
            >
              Connexion
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
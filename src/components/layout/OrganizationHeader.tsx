"use client";

import {
  Menu,
} from "lucide-react";

import ThemeToggle from "@/components/ui/ThemeToggle";
import OrganizationUserMenu from "@/features/organizations/components/OrganizationUserMenu";

interface OrganizationHeaderProps {
  organizationName?: string;
  onOpenMenu: () => void;
}

export default function OrganizationHeader({
  organizationName = "Organisation",
  onOpenMenu,
}: OrganizationHeaderProps) {
  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-16
        items-center
        justify-between
        border-b
        border-ikbs-border
        bg-ikbs-card/95
        px-4
        backdrop-blur
        sm:px-6
      "
    >
      {/* ========================= */}
      {/* LEFT */}
      {/* ========================= */}

      <div
        className="
          flex
          min-w-0
          items-center
          gap-3
        "
      >
        {/* MENU MOBILE */}

        <button
          type="button"
          onClick={onOpenMenu}
          className="
            inline-flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-lg
            border
            border-ikbs-border
            text-foreground
            transition

            hover:border-ikbs-primary
            hover:text-ikbs-primary

            lg:hidden
          "
          aria-label="Ouvrir le menu"
          title="Menu"
        >
          <Menu
            size={20}
            aria-hidden="true"
          />
        </button>

        {/* ORGANISATION */}

        <div className="min-w-0">
          <p
            className="
              truncate
              font-semibold
              text-foreground
            "
          >
            {organizationName}
          </p>

          <p
            className="
              hidden
              text-xs
              text-ikbs-muted
              sm:block
            "
          >
            Espace organisation
          </p>
        </div>
      </div>

      {/* ========================= */}
      {/* RIGHT */}
      {/* ========================= */}

      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        {/* THEME */}

        <ThemeToggle />

        {/* UTILISATEUR CONNECTÉ */}

        <OrganizationUserMenu />
      </div>
    </header>
  );
}
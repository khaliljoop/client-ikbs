"use client";

import {
  Menu,
  UserRound,
} from "lucide-react";

import ThemeToggle from "@/components/ui/ThemeToggle";

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
      {/* LEFT */}

      <div
        className="
          flex
          min-w-0
          items-center
          gap-3
        "
      >
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
          <Menu size={20} />
        </button>

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

      {/* RIGHT */}

      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <ThemeToggle />

        <button
          type="button"
          className="
            inline-flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            border
            border-ikbs-border
            bg-ikbs-card
            text-foreground
            transition

            hover:border-ikbs-primary
            hover:text-ikbs-primary
          "
          aria-label="Compte utilisateur"
          title="Mon compte"
        >
          <UserRound size={18} />
        </button>
      </div>
    </header>
  );
}
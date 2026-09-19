"use client";

import {
  Bell,
  Menu,
  UserRound,
} from "lucide-react";

import ThemeToggle from "@/components/ui/ThemeToggle";

interface AdminHeaderProps {
  onOpenSidebar: () => void;
}

export default function AdminHeader({
  onOpenSidebar,
}: AdminHeaderProps) {
  return (
    <header
      className="
        sticky top-0 z-30
        flex h-16 items-center
        justify-between
        border-b border-ikbs-border
        bg-background/95
        px-4 backdrop-blur
        sm:px-6
      "
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Ouvrir le menu"
          className="
            rounded-lg p-2
            text-ikbs-muted
            transition
            hover:bg-ikbs-primary/10
            hover:text-ikbs-primary
            lg:hidden
          "
        >
          <Menu size={22} />
        </button>

        <div>
          <p
            className="
              text-sm font-semibold
              text-foreground
            "
          >
            Administration IKBS
          </p>

          <p
            className="
              hidden text-xs
              text-ikbs-muted
              sm:block
            "
          >
            Gestion de la plateforme
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          aria-label="Notifications"
          className="
            relative rounded-lg p-2
            text-ikbs-muted
            transition
            hover:bg-ikbs-primary/10
            hover:text-ikbs-primary
          "
        >
          <Bell size={20} />

          <span
            className="
              absolute right-1.5 top-1.5
              h-2 w-2 rounded-full
              bg-red-500
            "
          />
        </button>

        <button
          type="button"
          className="
            flex items-center gap-2
            rounded-lg
            border border-ikbs-border
            px-2.5 py-2
            transition
            hover:border-ikbs-primary
          "
        >
          <UserRound
            size={18}
            className="text-ikbs-primary"
          />

          <span
            className="
              hidden text-sm font-medium
              text-foreground
              md:inline
            "
          >
            Administrateur
          </span>
        </button>
      </div>
    </header>
  );
}
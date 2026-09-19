"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { adminMenu } from "@/config/admin-menu";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({
  open,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dash") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={onClose}
          className="
            fixed inset-0 z-40
            bg-black/40
            lg:hidden
          "
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 flex-col
          border-r border-ikbs-border
          bg-ikbs-card
          transition-transform duration-300
          lg:translate-x-0

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <div
          className="
            flex h-16 items-center
            justify-between
            border-b border-ikbs-border
            px-5
          "
        >
          <Link
            href="/dash"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div
              className="
                flex h-9 w-9 items-center
                justify-center rounded-lg
                bg-ikbs-primary
                font-bold text-white
              "
            >
              I
            </div>

            <div>
              <p
                className="
                  font-semibold
                  text-foreground
                "
              >
                IKBS
              </p>

              <p
                className="
                  text-xs
                  text-ikbs-muted
                "
              >
                Administration
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="
              rounded-lg p-2
              text-ikbs-muted
              transition
              hover:bg-ikbs-primary/10
              hover:text-ikbs-primary
              lg:hidden
            "
          >
            <X size={20} />
          </button>
        </div>

        <nav
          className="
            flex-1 space-y-1
            overflow-y-auto
            p-4
          "
        >
          {adminMenu.map((item) => {
            const Icon = item.icon;
            const active =
              isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3
                  rounded-lg px-3 py-2.5
                  text-sm font-medium
                  transition

                  ${
                    active
                      ? `
                        bg-ikbs-primary/10
                        text-ikbs-primary
                      `
                      : `
                        text-ikbs-muted
                        hover:bg-ikbs-primary/5
                        hover:text-foreground
                      `
                  }
                `}
              >
                <Icon size={19} />

                <span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className="
            border-t border-ikbs-border
            p-4
          "
        >
          <p
            className="
              text-xs
              text-ikbs-muted
            "
          >
            IKBS Administration
          </p>
        </div>
      </aside>
    </>
  );
}
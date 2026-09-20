"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import {
  getOrganizationMenu,
} from "@/config/organization-menu";

import {
  organisationRoutes,
} from "@/config/routes";

interface OrganizationSidebarProps {
  organizationCode: string;

  collapsed: boolean;

  mobileOpen: boolean;

  onToggleCollapse: () => void;

  onCloseMobile: () => void;
}

export default function OrganizationSidebar({
  organizationCode,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: OrganizationSidebarProps) {
  const pathname = usePathname();

  const dashboardPath =
  organisationRoutes.dashboard(
    organizationCode,
  );

const menuItems =
  getOrganizationMenu(
    organizationCode,
  );

  const isActive = (
  href: string,
) => {
  /*
   * Dashboard :
   * uniquement correspondance exacte.
   */
  if (href === dashboardPath) {
    return pathname === href;
  }

  /*
   * Autres menus :
   * actif également sur les sous-routes.
   *
   * Exemple :
   * /espace/B1304049/membres/123
   */
  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
};

  return (
    <>
      {/* OVERLAY MOBILE */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={onCloseMobile}
          className="
            fixed
            inset-0
            z-40
            bg-black/50
            lg:hidden
          "
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50

          flex
          flex-col

          border-r
          border-ikbs-border
          bg-ikbs-card

          transition-all
          duration-300

          ${
            collapsed
              ? "lg:w-20"
              : "lg:w-64"
          }

          w-72

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* HEADER */}

        <div
          className="
            flex
            h-16
            shrink-0
            items-center
            justify-between
            border-b
            border-ikbs-border
            px-4
          "
        >
          {!collapsed && (
            <Link
                href={dashboardPath}
                className="
                    truncate
                    text-lg
                    font-bold
                    text-ikbs-primary
                "
                onClick={onCloseMobile}
                >
                IKBS
                </Link>
          )}

          {collapsed && (
            <Link
                href={dashboardPath}
                className="
                    hidden
                    w-full
                    text-center
                    text-lg
                    font-bold
                    text-ikbs-primary
                    lg:block
                "
                >
                I
            </Link>
          )}

          {/* CLOSE MOBILE */}

          <button
            type="button"
            onClick={onCloseMobile}
            className="
              inline-flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-ikbs-muted
              transition
              hover:bg-ikbs-primary/10
              hover:text-foreground
              lg:hidden
            "
            aria-label="Fermer le menu"
            title="Fermer"
          >
            <X size={19} />
          </button>
        </div>

        {/* NAVIGATION */}

        <nav
          className="
            flex-1
            overflow-y-auto
            p-3
          "
        >
          <ul className="space-y-1">
            {menuItems.map(
            (item) => {
                const active =
                isActive(
                    item.href,
                );

                const Icon =
                item.icon;

                return (
                <li key={item.key}>
                    <Link
                    href={item.href}
                    onClick={
                        onCloseMobile
                    }
                    title={
                        collapsed
                        ? item.label
                        : undefined
                    }
                    className={`
                        flex
                        h-11
                        items-center
                        rounded-lg
                        text-sm
                        font-medium
                        transition

                        ${
                        collapsed
                            ? `
                            lg:justify-center
                            lg:px-0
                            `
                            : `
                            gap-3
                            px-3
                            `
                        }

                        ${
                        active
                            ? `
                            bg-ikbs-primary
                            text-white
                            `
                            : `
                            text-ikbs-muted
                            hover:bg-ikbs-primary/10
                            hover:text-ikbs-primary
                            `
                        }
                    `}
                    >
                    <Icon
                        size={19}
                        className="shrink-0"
                    />

                    <span
                        className={`
                        truncate

                        ${
                            collapsed
                            ? "lg:hidden"
                            : ""
                        }
                        `}
                    >
                        {item.label}
                    </span>
                    </Link>
                </li>
                );
            },
            )}
          </ul>
        </nav>

        {/* COLLAPSE DESKTOP */}

        <div
          className="
            hidden
            border-t
            border-ikbs-border
            p-3
            lg:block
          "
        >
          <button
            type="button"
            onClick={
              onToggleCollapse
            }
            className={`
              flex
              h-10
              w-full
              items-center
              rounded-lg
              text-sm
              text-ikbs-muted
              transition

              hover:bg-ikbs-primary/10
              hover:text-ikbs-primary

              ${
                collapsed
                  ? "justify-center"
                  : "gap-3 px-3"
              }
            `}
            title={
              collapsed
                ? "Développer"
                : "Réduire"
            }
          >
            {collapsed ? (
              <ChevronRight
                size={18}
              />
            ) : (
              <>
                <ChevronLeft
                  size={18}
                />

                <span>
                  Réduire
                </span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
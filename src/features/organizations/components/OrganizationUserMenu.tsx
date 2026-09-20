"use client";

import {
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { routes } from "@/config/routes";
import {
  getMockUser,
  removeMockUser,
} from "@/lib/auth/mock-auth";
import type {
  MockUser,
} from "@/mocks/auth";

export default function OrganizationUserMenu() {
  const router = useRouter();

  const menuRef =
    useRef<HTMLDivElement>(null);

  const [user, setUser] =
    useState<MockUser | null>(null);

  const [open, setOpen] =
    useState(false);

  useEffect(() => {
    setUser(
      getMockUser(),
    );
  }, []);

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  const handleLogout = () => {
    removeMockUser();

    setOpen(false);

    router.replace(
      routes.login,
    );

    router.refresh();
  };

  if (!user) {
    return null;
  }

  const fullName =
    `${user.firstName} ${user.lastName}`.trim();

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
      .toUpperCase();

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) => !current,
          )
        }
        aria-expanded={open}
        aria-haspopup="menu"
        className="
          flex
          items-center
          gap-3
          rounded-xl
          px-2
          py-1.5
          transition
          hover:bg-ikbs-primary/10
        "
      >
        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-ikbs-primary
            text-xs
            font-bold
            text-white
          "
        >
          {initials || (
            <UserRound
              size={18}
            />
          )}
        </div>

        <div
          className="
            hidden
            min-w-0
            text-left
            md:block
          "
        >
          <p
            className="
              max-w-40
              truncate
              text-sm
              font-semibold
              text-foreground
            "
          >
            {fullName}
          </p>

          <p
            className="
              max-w-40
              truncate
              text-xs
              text-ikbs-muted
            "
          >
            {user.email}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`
            hidden
            shrink-0
            text-ikbs-muted
            transition-transform
            md:block
            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="
            absolute
            right-0
            top-full
            z-50
            mt-2
            w-64
            overflow-hidden
            rounded-xl
            border
            border-ikbs-border
            bg-ikbs-card
            shadow-lg
          "
        >
          {/* Informations utilisateur */}

          <div
            className="
              border-b
              border-ikbs-border
              px-4
              py-3
            "
          >
            <p
              className="
                truncate
                text-sm
                font-semibold
                text-foreground
              "
            >
              {fullName}
            </p>

            <p
              className="
                mt-0.5
                truncate
                text-xs
                text-ikbs-muted
              "
            >
              {user.email}
            </p>

            <div className="mt-2">
              <span
                className="
                  inline-flex
                  rounded-full
                  bg-ikbs-primary/10
                  px-2.5
                  py-1
                  text-xs
                  font-medium
                  text-ikbs-primary
                "
              >
                {user.role === "ORG_ADMIN"
                  ? "Administrateur"
                  : user.role === "SUPER_ADMIN"
                    ? "Super administrateur"
                    : "Membre"}
              </span>
            </div>
          </div>

          {/* Actions */}

          <div className="p-2">
            <button
              type="button"
              role="menuitem"
              onClick={
                handleLogout
              }
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-lg
                px-3
                py-2.5
                text-left
                text-sm
                font-medium
                text-red-600
                transition

                hover:bg-red-50

                dark:text-red-400
                dark:hover:bg-red-950/30
              "
            >
              <LogOut
                size={17}
              />

              <span>
                Se déconnecter
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
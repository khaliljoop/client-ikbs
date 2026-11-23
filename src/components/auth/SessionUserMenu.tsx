"use client";

import Link from "next/link";

import {
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { authErrorMessage } from "@/lib/api/auth";
import { useSession } from "./SessionProvider";

export default function SessionUserMenu() {
  const { profile, signOut } = useSession();

  const menuRef =
    useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

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

  const handleLogout = async () => {
    setError("");
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setError(authErrorMessage(error, "logout"));
      setSigningOut(false);
    }
  };

  if (!profile) return null;
  const fullName = profile.user.displayName;
  const initials = fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

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
          <p className="max-w-40 truncate text-sm font-semibold text-foreground">{fullName}</p>
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
            <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
          </div>

          {/* Actions */}

          <div className="p-2">
            <Link href="/espaces" role="menuitem" onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-ikbs-primary/10">Changer d’espace</Link>
            {error && <p role="alert" className="px-3 py-2 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
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
                {signingOut ? "Déconnexion…" : "Se déconnecter"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
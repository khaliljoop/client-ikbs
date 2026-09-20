"use client";

import {
  LoaderCircle,
  ShieldX,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useState,
} from "react";

import { routes } from "@/config/routes";
import {
  canAccessOrganization,
  getMockUser,
} from "@/lib/auth/mock-auth";

interface OrganizationAuthGuardProps {
  organizationCode: string;
  children: ReactNode;
}

type AccessStatus =
  | "CHECKING"
  | "AUTHORIZED"
  | "FORBIDDEN";

export default function OrganizationAuthGuard({
  organizationCode,
  children,
}: OrganizationAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] =
    useState<AccessStatus>(
      "CHECKING",
    );

  useEffect(() => {
    const user =
      getMockUser();
       console.log(
    "AUTH GUARD:",
    {
      pathname,
      organizationCode,
      user,
    },
  );

    /*
     * Aucun utilisateur connecté :
     * retour au login.
     */
    if (!user) {
      const redirect =
        pathname ||
        `/espace/${organizationCode}`;

      router.replace(
        `${routes.login}?redirect=${encodeURIComponent(
          redirect,
        )}`,
      );

      return;
    }

    /*
     * Utilisateur connecté mais
     * sans accès à cette organisation.
     */
    if (
      !canAccessOrganization(
        user,
        organizationCode,
      )
    ) {
      setStatus(
        "FORBIDDEN",
      );

      return;
    }

    console.log(
        "AUTH GUARD accès autorisé:",
        {
            organizationCode,
            pathname,
        },
        );

        setStatus(
        "AUTHORIZED",
        );

    setStatus(
      "AUTHORIZED",
    );
  }, [
    organizationCode,
    pathname,
    router,
  ]);

  if (
    status === "CHECKING"
  ) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-background
        "
      >
        <div className="text-center">
          <LoaderCircle
            size={30}
            className="
              mx-auto
              animate-spin
              text-ikbs-primary
            "
          />

          <p
            className="
              mt-4
              text-sm
              text-ikbs-muted
            "
          >
            Vérification de votre accès...
          </p>
        </div>
      </div>
    );
  }

  if (
    status === "FORBIDDEN"
  ) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-background
          px-4
        "
      >
        <div
          className="
            w-full
            max-w-md
            rounded-2xl
            border
            border-ikbs-border
            bg-ikbs-card
            p-8
            text-center
            shadow-sm
          "
        >
          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-red-500/10
              text-red-500
            "
          >
            <ShieldX
              size={27}
            />
          </div>

          <h1
            className="
              mt-5
              text-xl
              font-semibold
              text-foreground
            "
          >
            Accès refusé
          </h1>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-ikbs-muted
            "
          >
            Votre compte n&apos;est
            pas autorisé à accéder à
            cette organisation.
          </p>

          <Link
            href={routes.organisations}
            className="
              mt-6
              inline-flex
              h-10
              items-center
              justify-center
              rounded-xl
              bg-ikbs-primary
              px-4
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-ikbs-primary-dark
            "
          >
            Voir les organisations
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
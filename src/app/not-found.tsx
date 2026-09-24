import {
  ArrowLeft,
  Building2,
  Home,
  SearchX,
} from "lucide-react";
import Link from "next/link";

import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <main
      className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-background
        px-4
        py-12
      "
    >
      {/* Décoration */}
      <div
        aria-hidden="true"
        className="
          absolute
          -left-24
          -top-24
          h-72
          w-72
          rounded-full
          bg-ikbs-primary/10
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          absolute
          -bottom-24
          -right-24
          h-72
          w-72
          rounded-full
          bg-ikbs-success/10
          blur-3xl
        "
      />

      <div
        className="
          relative
          z-10
          w-full
          max-w-2xl
          text-center
        "
      >
        {/* Logo / marque */}
        <Link
          href={routes.home}
          className="
            mx-auto
            inline-flex
            items-center
            gap-2
            text-ikbs-primary
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-ikbs-primary
              text-white
              shadow-sm
            "
          >
            <Building2 size={20} />
          </div>

          <span
            className="
              text-xl
              font-bold
              tracking-tight
              text-foreground
            "
          >
            IKBS
          </span>
        </Link>

        {/* Illustration 404 */}
        <div className="mt-10">
          <div
            className="
              mx-auto
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-3xl
              border
              border-ikbs-border
              bg-ikbs-card
              text-ikbs-primary
              shadow-sm
            "
          >
            <SearchX size={36} />
          </div>

          <p
            className="
              mt-8
              text-7xl
              font-black
              tracking-tight
              text-ikbs-primary
              sm:text-8xl
            "
          >
            404
          </p>
        </div>

        {/* Message */}
        <h1
          className="
            mt-5
            text-2xl
            font-bold
            tracking-tight
            text-foreground
            sm:text-3xl
          "
        >
          Page introuvable
        </h1>

        <p
          className="
            mx-auto
            mt-4
            max-w-lg
            text-sm
            leading-7
            text-ikbs-muted
            sm:text-base
          "
        >
          La page que vous recherchez n&apos;existe pas,
          a peut-être été déplacée ou n&apos;est plus
          disponible.
        </p>

        {/* Actions */}
        <div
          className="
            mt-8
            flex
            flex-col
            items-center
            justify-center
            gap-3
            sm:flex-row
          "
        >
          <Link
            href={routes.home}
            className="
              inline-flex
              h-11
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-ikbs-primary
              px-5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-ikbs-primary-dark
              sm:w-auto
            "
          >
            <Home size={17} />

            Retour à l&apos;accueil
          </Link>

          <Link
            href={routes.organisations}
            className="
              inline-flex
              h-11
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-ikbs-border
              bg-ikbs-card
              px-5
              text-sm
              font-semibold
              text-foreground
              transition
              hover:bg-ikbs-primary/5
              hover:text-ikbs-primary
              sm:w-auto
            "
          >
            <Building2 size={17} />

            Voir les organisations
          </Link>
        </div>

        {/* Retour */}
        <div
          className="
            mt-10
            flex
            justify-center
          "
        >
          <Link
            href={routes.home}
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-medium
              text-ikbs-muted
              transition
              hover:text-ikbs-primary
            "
          >
            <ArrowLeft size={16} />

            Revenir au site IKBS
          </Link>
        </div>
      </div>
    </main>
  );
}
import {
  Building2,
} from "lucide-react";
import Link from "next/link";

import type { PublicOrganization } from "@/types/organization";
import { organisationRoutes } from "@/config/routes";

interface OrganizationPublicCardProps {
  organization: PublicOrganization;
}

export default function OrganizationPublicCard({
  organization,
}: OrganizationPublicCardProps) {
  return (
    <article
      className="
        group flex h-full flex-col
        overflow-hidden rounded-2xl
        border border-ikbs-border
        bg-ikbs-card
        shadow-sm
        transition-all duration-300
        hover:-translate-y-1
        hover:border-ikbs-primary/40
        hover:shadow-lg
      "
    >
      {/* Header visuel */}
      <div
        className="
          relative h-28
          bg-gradient-to-br
          from-ikbs-primary/15
          via-ikbs-primary/5
          to-transparent
        "
      >
        <div
          className="
            absolute -bottom-8 left-6
            flex h-16 w-16
            items-center justify-center
            overflow-hidden rounded-2xl
            border-4 border-ikbs-card
            bg-background
            shadow-sm
          "
        >
          {organization.logoUrl ? (
            <img
              src={organization.logoUrl}
              alt={`Logo ${organization.name}`}
              className="
                h-full w-full
                object-cover
              "
            />
          ) : (
            <Building2
              size={28}
              className="text-ikbs-primary"
            />
          )}
        </div>
      </div>

      {/* Contenu */}
      <div
        className="
          flex flex-1 flex-col
          px-6 pb-6 pt-12
        "
      >
        <div>
          <h2
            className="
              text-lg font-semibold
              text-foreground
              transition
              group-hover:text-ikbs-primary
            "
          >
            {organization.name}
          </h2>

          <p
            className="
              mt-1 text-xs font-medium
              uppercase tracking-wide
              text-ikbs-primary
            "
          >
            {organization.code}
          </p>
        </div>

        <p
          className="
            mt-4 line-clamp-3
            min-h-[72px]
            text-sm leading-6
            text-ikbs-muted
          "
        >
          {organization.description ||
            "Découvrez cette organisation et ses activités sur la plateforme IKBS."}
        </p>

        {/* Footer */}
        <div className="mt-auto pt-6">
          {/* <Link
            href={`/organisations/${organization.code}`}
            className="
              flex w-full items-center
              justify-between
              rounded-xl
              bg-ikbs-primary/10
              px-4 py-3
              text-sm font-semibold
              text-ikbs-primary
              transition
              hover:bg-ikbs-primary
              hover:text-white
            "
          >
            <span>
              Voir l&apos;organisation
            </span>

            <ArrowRight
              size={17}
              className="
                transition-transform
                group-hover:translate-x-1
              "
            />
          </Link> */}
          <Link
            href={organisationRoutes.public(
                organization.code,
            )}
            >
            Voir l&apos;organisation
            </Link>
        </div>
      </div>
    </article>
  );
}
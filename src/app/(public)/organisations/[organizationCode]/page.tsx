import {
  ArrowRight,
  Building2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { routes } from "@/config/routes";
import { getPublicOrganization } from "@/lib/api/organizations";

interface OrganizationDetailsPageProps {
  params: Promise<{
    organizationCode: string;
  }>;
}

export default async function OrganizationDetailsPage({
  params,
}: OrganizationDetailsPageProps) {
  const { organizationCode } =
    await params;

  let organization;

  try {
    organization =
      await getPublicOrganization(
        organizationCode,
      );
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ========================= */}
      {/* HERO */}
      {/* ========================= */}

      <section
        className="
          border-b border-ikbs-border
          bg-gradient-to-b
          from-ikbs-primary/10
          via-ikbs-primary/5
          to-background
        "
      >
        <div
          className="
            mx-auto max-w-7xl
            px-4 py-10
            sm:px-6
            lg:px-8
          "
        >
          {/* Retour */}
          <Link
            href={routes.organisations}
            className="
              inline-flex items-center
              gap-2
              text-sm font-medium
              text-ikbs-muted
              transition
              hover:text-ikbs-primary
            "
          >
            <span>←</span>
            Retour aux organisations
          </Link>

          <div
            className="
              mt-8
              flex flex-col
              gap-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            {/* Identité */}
            <div
              className="
                flex flex-col
                gap-5
                sm:flex-row
                sm:items-center
              "
            >
              {/* Logo */}
              <div
                className="
                  flex h-24 w-24
                  shrink-0 items-center
                  justify-center
                  overflow-hidden
                  rounded-2xl
                  border border-ikbs-border
                  bg-ikbs-card
                  shadow-sm
                "
              >
                {organization.logoUrl ? (
                  <img
                    src={
                      organization.logoUrl
                    }
                    alt={`Logo ${organization.name}`}
                    className="
                      h-full w-full
                      object-cover
                    "
                  />
                ) : (
                  <Building2
                    size={38}
                    className="text-ikbs-primary"
                  />
                )}
              </div>

              {/* Nom */}
              <div>
                <p
                  className="
                    text-sm font-semibold
                    uppercase
                    tracking-wider
                    text-ikbs-primary
                  "
                >
                  {organization.code}
                </p>

                <h1
                  className="
                    mt-2
                    text-3xl font-bold
                    tracking-tight
                    text-foreground
                    sm:text-4xl
                  "
                >
                  {organization.name}
                </h1>

                {organization.address && (
                  <div
                    className="
                      mt-3
                      flex items-center
                      gap-2
                      text-sm
                      text-ikbs-muted
                    "
                  >
                    <MapPin size={16} />

                    {organization.address}
                  </div>
                )}
              </div>
            </div>

            {/* Espace privé */}
            <Link
              href={`/login?redirect=${encodeURIComponent(
                `/organisations/${organization.code}`,
              )}`}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-ikbs-primary
                px-5 py-3
                text-sm font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-ikbs-primary-dark
              "
            >
              Accéder à l&apos;espace

              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================= */}
      {/* CONTENU */}
      {/* ========================= */}

      <section
        className="
          mx-auto max-w-7xl
          px-4 py-10
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            grid gap-8
            lg:grid-cols-[1fr_320px]
          "
        >
          {/* Colonne principale */}
          <div className="space-y-8">
            {/* Présentation */}
            <article
              className="
                rounded-2xl
                border border-ikbs-border
                bg-ikbs-card
                p-6
                sm:p-8
              "
            >
              <h2
                className="
                  text-xl font-semibold
                  text-foreground
                "
              >
                Présentation
              </h2>

              <p
                className="
                  mt-4
                  whitespace-pre-line
                  text-sm
                  leading-7
                  text-ikbs-muted
                  sm:text-base
                "
              >
                {organization.description ||
                  "Aucune présentation n'est encore disponible pour cette organisation."}
              </p>
            </article>

            {/* Commissions */}
            <article
              className="
                rounded-2xl
                border border-ikbs-border
                bg-ikbs-card
                p-6
                sm:p-8
              "
            >
              <div>
                <h2
                  className="
                    text-xl font-semibold
                    text-foreground
                  "
                >
                  Commissions
                </h2>

                <p
                  className="
                    mt-1 text-sm
                    text-ikbs-muted
                  "
                >
                  Les commissions de
                  l&apos;organisation seront
                  présentées ici.
                </p>
              </div>

              <div
                className="
                  mt-6
                  rounded-xl
                  border border-dashed
                  border-ikbs-border
                  p-8
                  text-center
                "
              >
                <p className="text-sm text-ikbs-muted">
                  Aucune commission publique
                  disponible pour le moment.
                </p>
              </div>
            </article>

            {/* Événements */}
            <article
              className="
                rounded-2xl
                border border-ikbs-border
                bg-ikbs-card
                p-6
                sm:p-8
              "
            >
              <h2
                className="
                  text-xl font-semibold
                  text-foreground
                "
              >
                Événements
              </h2>

              <p
                className="
                  mt-2 text-sm
                  text-ikbs-muted
                "
              >
                Les événements publics de
                l&apos;organisation apparaîtront
                ici.
              </p>
            </article>
          </div>

          {/* ========================= */}
          {/* CONTACT */}
          {/* ========================= */}

          <aside>
            <div
              className="
                rounded-2xl
                border border-ikbs-border
                bg-ikbs-card
                p-6
                lg:sticky
                lg:top-24
              "
            >
              <h2
                className="
                  text-lg font-semibold
                  text-foreground
                "
              >
                Coordonnées
              </h2>

              <div className="mt-5 space-y-5">
                {organization.email && (
                  <div className="flex gap-3">
                    <div
                      className="
                        flex h-9 w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-ikbs-primary/10
                        text-ikbs-primary
                      "
                    >
                      <Mail size={17} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          text-xs
                          text-ikbs-muted
                        "
                      >
                        Email
                      </p>

                      <p
                        className="
                          mt-1 truncate
                          text-sm font-medium
                          text-foreground
                        "
                      >
                        {organization.email}
                      </p>
                    </div>
                  </div>
                )}

                {organization.phone && (
                  <div className="flex gap-3">
                    <div
                      className="
                        flex h-9 w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-ikbs-primary/10
                        text-ikbs-primary
                      "
                    >
                      <Phone size={17} />
                    </div>

                    <div>
                      <p
                        className="
                          text-xs
                          text-ikbs-muted
                        "
                      >
                        Téléphone
                      </p>

                      <p
                        className="
                          mt-1 text-sm
                          font-medium
                          text-foreground
                        "
                      >
                        {organization.phone}
                      </p>
                    </div>
                  </div>
                )}

                {organization.address && (
                  <div className="flex gap-3">
                    <div
                      className="
                        flex h-9 w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-ikbs-primary/10
                        text-ikbs-primary
                      "
                    >
                      <MapPin size={17} />
                    </div>

                    <div>
                      <p
                        className="
                          text-xs
                          text-ikbs-muted
                        "
                      >
                        Adresse
                      </p>

                      <p
                        className="
                          mt-1 text-sm
                          font-medium
                          text-foreground
                        "
                      >
                        {organization.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="
                  mt-6
                  border-t
                  border-ikbs-border
                  pt-6
                "
              >
                <Link
                  href={`/login?redirect=${encodeURIComponent(
                    `/organisations/${organization.code}`,
                  )}`}
                  className="
                    flex w-full
                    items-center
                    justify-center
                    gap-2
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
                  Accéder à l&apos;espace

                  <ArrowRight size={16} />
                </Link>

                <p
                  className="
                    mt-3 text-center
                    text-xs
                    leading-5
                    text-ikbs-muted
                  "
                >
                  Une authentification est
                  nécessaire pour accéder à
                  l&apos;espace privé.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
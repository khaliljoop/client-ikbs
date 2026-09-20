

"use client";

import {
  Search,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import OrganizationPublicList from "@/features/organizations/components/OrganizationPublicList";
import {
  listPublicOrganizations,
} from "@/lib/api/organizations";
import type { Organization } from "@/types/organization";

export default function OrganizationsPage() {
  const [
    organizations,
    setOrganizations,
  ] = useState<Organization[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(9);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  /*
   * Debounce de la recherche.
   */
  useEffect(() => {
    const timeout =
      window.setTimeout(() => {
        setDebouncedSearch(
          search.trim(),
        );
      }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);

  /*
   * Chargement des organisations.
   */
  const fetchOrganizations =
    useCallback(async () => {
      setLoading(true);

      try {
        const response =
          await listPublicOrganizations({
            page,
            limit,
            search:
              debouncedSearch ||
              undefined,
          });

        setOrganizations(
          response.items,
        );

        setTotal(response.total);
      } catch (error) {
        console.error(
          "Erreur chargement organisations :",
          error,
        );

        setOrganizations([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, [
      page,
      limit,
      debouncedSearch,
    ]);

  useEffect(() => {
    void fetchOrganizations();
  }, [fetchOrganizations]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(total / limit),
    );

  return (
    <div className="bg-background">
      {/* Hero */}
      <section
        className="
          border-b border-ikbs-border
          bg-gradient-to-b
          from-ikbs-primary/10
          to-background
        "
      >
        <div
          className="
            mx-auto max-w-7xl
            px-4 py-14
            sm:px-6
            lg:px-8
          "
        >
          <div className="max-w-2xl">
            <p
              className="
                text-sm font-semibold
                uppercase tracking-wider
                text-ikbs-primary
              "
            >
              Réseau IKBS
            </p>

            <h1
              className="
                mt-3 text-3xl
                font-bold tracking-tight
                text-foreground
                sm:text-4xl
              "
            >
              Découvrez nos organisations
            </h1>

            <p
              className="
                mt-4 text-base
                leading-7
                text-ikbs-muted
              "
            >
              Découvrez les organisations
              présentes sur la plateforme,
              leurs activités, leurs
              commissions et leurs
              coordonnées.
            </p>
          </div>

          {/* Recherche */}
          <div
            className="
              relative mt-8
              max-w-xl
            "
          >
            <Search
              size={19}
              className="
                absolute left-4 top-1/2
                -translate-y-1/2
                text-ikbs-muted
              "
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );

                setPage(1);
              }}
              placeholder="Rechercher une organisation..."
              className="
                h-12 w-full
                rounded-xl
                border border-ikbs-border
                bg-ikbs-card
                pl-11 pr-11
                text-sm text-foreground
                outline-none
                transition
                placeholder:text-ikbs-muted
                focus:border-ikbs-primary
                focus:ring-2
                focus:ring-ikbs-primary/10
              "
            />

            {search && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="
                  absolute right-3 top-1/2
                  -translate-y-1/2
                  rounded-lg p-1.5
                  text-ikbs-muted
                  transition
                  hover:bg-ikbs-primary/10
                  hover:text-ikbs-primary
                "
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Organisations */}
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
            mb-6 flex
            items-center
            justify-between
          "
        >
          <div>
            <h2
              className="
                text-xl font-semibold
                text-foreground
              "
            >
              Organisations
            </h2>

            {!loading && (
              <p
                className="
                  mt-1 text-sm
                  text-ikbs-muted
                "
              >
                {total} organisation
                {total > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        <OrganizationPublicList
          organizations={
            organizations
          }
          loading={loading}
        />

        {/* Pagination */}
        {!loading &&
          totalPages > 1 && (
            <div
              className="
                mt-10 flex
                items-center
                justify-center gap-3
              "
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (current) =>
                      current - 1,
                  )
                }
                className="
                  rounded-lg
                  border border-ikbs-border
                  bg-ikbs-card
                  px-4 py-2
                  text-sm font-medium
                  text-foreground
                  transition
                  hover:border-ikbs-primary
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Précédent
              </button>

              <span
                className="
                  text-sm
                  text-ikbs-muted
                "
              >
                Page{" "}
                <strong className="text-foreground">
                  {page}
                </strong>{" "}
                sur {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1,
                  )
                }
                className="
                  rounded-lg
                  border border-ikbs-border
                  bg-ikbs-card
                  px-4 py-2
                  text-sm font-medium
                  text-foreground
                  transition
                  hover:border-ikbs-primary
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Suivant
              </button>
            </div>
          )}
      </section>
    </div>
  );
}
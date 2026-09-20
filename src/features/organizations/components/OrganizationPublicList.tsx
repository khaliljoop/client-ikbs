import {Building2} from "lucide-react";
import type { Organization } from "@/types/organization";

import OrganizationPublicCard from "./OrganizationPublicCard";

interface OrganizationPublicListProps {
  organizations: Organization[];
  loading?: boolean;
}

export default function OrganizationPublicList({
  organizations,
  loading = false,
}: OrganizationPublicListProps) {
  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ikbs-muted">
        Chargement des organisations...
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div
        className="
          rounded-2xl
          border border-ikbs-border
          bg-ikbs-card
          p-12 text-center
        "
      >
        <Building2
          size={36}
          className="mx-auto text-ikbs-muted"
        />

        <h3 className="mt-4 font-semibold text-foreground">
          Aucune organisation trouvée
        </h3>

        <p className="mt-1 text-sm text-ikbs-muted">
          Aucune organisation ne correspond à votre recherche.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        grid gap-6
        sm:grid-cols-2
        xl:grid-cols-3
      "
    >
      {organizations.map((organization) => (
      <OrganizationPublicCard
        key={organization.code ?? `${new Date().getTime()}`}
        organization={organization}
      />
    ))}
    </div>
  );
}
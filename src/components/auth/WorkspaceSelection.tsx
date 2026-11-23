"use client";

import Link from "next/link";
import { accessibleOrganizations, canManageOrganizations } from "@/lib/auth/workspaces";
import SessionUserMenu from "./SessionUserMenu";
import { useSession } from "./SessionProvider";

export default function WorkspaceSelection() {
  const { profile } = useSession();
  const global = canManageOrganizations(profile);
  const organizations = accessibleOrganizations(profile);
  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Mes espaces</h1>
        <SessionUserMenu />
      </header>
      {!global && organizations.length === 0 ? (
        <p className="rounded-xl border border-ikbs-border bg-ikbs-card p-5">
          Votre compte est connecté, mais aucun espace IKBS ne vous est accessible.
        </p>
      ) : (
        <ul className="space-y-3">
          {global && (
            <li><Link className="block rounded-xl border border-ikbs-border p-4 hover:border-ikbs-primary" href="/dash">Administration globale</Link></li>
          )}
          {organizations.map((organization) => (
            <li key={organization.id}>
              <Link className="block rounded-xl border border-ikbs-border p-4 hover:border-ikbs-primary"
                href={"/espace/" + organization.code}>
                <span className="font-medium">{organization.name}</span>
                <span className="ml-2 text-sm text-ikbs-muted">{organization.code}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/organisations" className="text-ikbs-primary">Consulter l’annuaire public</Link>
    </section>
  );
}

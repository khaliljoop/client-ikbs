"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { canManageOrganizations, findWorkspace, requestReview, workspacePath } from "@/lib/auth/workspaces";
import { useSession } from "./SessionProvider";

export function WorkspaceUnavailable({ kind }: { kind: "global" | "local" }) {
  return (
    <section className="mx-auto max-w-lg space-y-4 rounded-xl border border-ikbs-border bg-ikbs-card p-6">
      <h1 className="text-xl font-semibold">{kind === "global" ? "Accès refusé" : "Espace indisponible"}</h1>
      <p role="alert" className="text-ikbs-muted">
        {kind === "global" ? "Votre compte ne dispose pas des droits nécessaires." :
          "Cette organisation est introuvable ou votre compte ne peut plus accéder à son espace."}
      </p>
      <Link href={workspacePath} className="font-medium text-ikbs-primary">Voir mes espaces</Link>
    </section>
  );
}

export default function WorkspaceAccess({ children, organizationCode, allowReview = false }: {
  children: ReactNode;
  organizationCode?: string;
  allowReview?: boolean;
}) {
  const { profile } = useSession();
  if (organizationCode !== undefined) {
    return findWorkspace(profile, organizationCode) ? children : <WorkspaceUnavailable kind="local" />;
  }
  return (canManageOrganizations(profile) || (allowReview && profile.globalPermissions.includes(requestReview))) ? children : <WorkspaceUnavailable kind="global" />;
}

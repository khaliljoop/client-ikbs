"use client";

import Link from "next/link";
import { useSession } from "@/components/auth/SessionProvider";
import { canManageOrganizations, requestReview } from "@/lib/auth/workspaces";

const tile = "inline-block rounded-lg border border-ikbs-border bg-ikbs-card p-4 text-ikbs-primary";

export default function AdminDashboardPage() {
  const { profile } = useSession();
  return <section className="space-y-5">
    <h1 className="text-2xl font-bold">Administration globale</h1>
    <div className="flex flex-wrap gap-3">
      {profile.globalPermissions.includes(requestReview) && <Link href="/dash/demandes" className={tile}>Traiter les demandes</Link>}
      {canManageOrganizations(profile) && <Link href="/dash/organisations" className={tile}>Gérer les organisations</Link>}
    </div>
  </section>;
}

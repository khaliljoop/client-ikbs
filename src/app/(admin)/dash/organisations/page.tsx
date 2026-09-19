import OrganizationManagement from "@/features/organizations/components/OrganizationManagement";

export default function AdminOrganizationsPage() {
  return (
    <div className="space-y-6">
      {/* <div>
        <h1 className="text-2xl font-bold text-foreground">
          Organisations
        </h1>

        <p className="mt-1 text-sm text-ikbs-muted">
          Gérez les organisations enregistrées sur la plateforme IKBS.
        </p>
      </div> */}

      <OrganizationManagement />
    </div>
  );
}
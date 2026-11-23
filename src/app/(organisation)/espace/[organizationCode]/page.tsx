import OrganizationWorkspace from "@/features/organizations/components/OrganizationWorkspace";

export default async function OrganizationDashboardPage({ params }: {
  params: Promise<{ organizationCode: string }>;
}) {
  const { organizationCode } = await params;
  return <OrganizationWorkspace code={organizationCode} />;
}

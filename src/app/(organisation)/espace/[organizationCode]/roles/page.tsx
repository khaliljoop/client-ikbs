import RoleWorkspace from "@/features/roles/components/RoleWorkspace";

export default async function RoleWorkspacePage({ params }: { params: Promise<{ organizationCode: string }> }) {
  const { organizationCode } = await params;
  return <RoleWorkspace code={organizationCode} />;
}

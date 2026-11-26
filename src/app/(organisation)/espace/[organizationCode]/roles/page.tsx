import RoleWorkspace from "@/features/roles/components/RoleWorkspace";

export default async function RoleWorkspacePage({ params, searchParams }: {
  params: Promise<{ organizationCode: string }>;
  searchParams: Promise<{ memberId?: string | string[] }>;
}) {
  const [{ organizationCode }, { memberId }] = await Promise.all([params, searchParams]);
  return <RoleWorkspace code={organizationCode} memberId={typeof memberId === "string" && memberId ? memberId : undefined} />;
}

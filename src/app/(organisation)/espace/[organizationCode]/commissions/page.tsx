import CommissionWorkspace from "@/features/commissions/components/CommissionWorkspace";

export default async function CommissionsPage({ params }: { params: Promise<{ organizationCode: string }> }) {
  const { organizationCode } = await params;
  return <CommissionWorkspace code={organizationCode} />;
}

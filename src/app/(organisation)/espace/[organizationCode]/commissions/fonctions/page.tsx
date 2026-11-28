import CommissionFunctionWorkspace from "@/features/commissions/components/CommissionFunctionWorkspace";

export default async function CommissionFunctionsPage({ params }: { params: Promise<{ organizationCode: string }> }) {
  const { organizationCode } = await params;
  return <CommissionFunctionWorkspace code={organizationCode} />;
}

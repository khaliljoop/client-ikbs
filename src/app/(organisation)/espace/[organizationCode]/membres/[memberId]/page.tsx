import MemberDirectory from "@/features/members/components/MemberDirectory";

export default async function MemberPage({ params }: {
  params: Promise<{ organizationCode: string; memberId: string }>;
}) {
  const { organizationCode, memberId } = await params;
  return <MemberDirectory code={organizationCode} memberId={memberId} />;
}

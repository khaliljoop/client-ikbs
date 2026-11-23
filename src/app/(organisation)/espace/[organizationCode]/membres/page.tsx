import MemberDirectory from "@/features/members/components/MemberDirectory";

export default async function MembersPage({ params }: { params: Promise<{ organizationCode: string }> }) {
  const { organizationCode } = await params;
  return <MemberDirectory code={organizationCode} />;
}

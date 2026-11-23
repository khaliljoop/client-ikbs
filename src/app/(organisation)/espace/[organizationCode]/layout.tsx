import WorkspaceAccess from "@/components/auth/WorkspaceAccess";
import type {
  ReactNode,
} from "react";

import SessionGate from "@/components/auth/SessionGate";
import OrganizationShell from "@/components/layout/OrganizationShell";

interface OrganizationLayoutProps {
  children: ReactNode;

  params: Promise<{
    organizationCode: string;
  }>;
}

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const {
    organizationCode,
  } = await params;

  return (
    <SessionGate returnPath={"/espace/" + organizationCode}>
      <WorkspaceAccess organizationCode={organizationCode}>
        <OrganizationShell organizationCode={organizationCode}>{children}</OrganizationShell>
      </WorkspaceAccess>
    </SessionGate>
  );
}
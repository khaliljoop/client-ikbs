import type {
  ReactNode,
} from "react";

import OrganizationAuthGuard from "@/features/organizations/components/OrganizationAuthGuard";
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
    <OrganizationAuthGuard
      organizationCode={
        organizationCode
      }
    >
      <OrganizationShell
        organizationCode={
          organizationCode
        }
      >
        {children}
      </OrganizationShell>
    </OrganizationAuthGuard>
  );
}
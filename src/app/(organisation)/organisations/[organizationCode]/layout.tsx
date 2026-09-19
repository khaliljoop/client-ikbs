import type {
  ReactNode,
} from "react";

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
    <OrganizationShell
      organizationCode={
        organizationCode
      }
    >
      {children}
    </OrganizationShell>
  );
}
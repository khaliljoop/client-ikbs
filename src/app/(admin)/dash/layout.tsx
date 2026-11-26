import WorkspaceAccess from "@/components/auth/WorkspaceAccess";
import SessionGate from "@/components/auth/SessionGate";
import type { ReactNode } from "react";

import AdminShell from "@/components/admin/AdminShell";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <SessionGate returnPath="/dash">
      <WorkspaceAccess allowReview><AdminShell>{children}</AdminShell></WorkspaceAccess>
    </SessionGate>
  );
}
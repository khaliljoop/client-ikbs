import type { ReactNode } from "react";

import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <>
      <PublicHeader />

      <main>
        {children}
      </main>

      <PublicFooter />
    </>
  );
}
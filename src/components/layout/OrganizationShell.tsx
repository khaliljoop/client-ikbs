"use client";

import {
  useState,
  type ReactNode,
} from "react";

import OrganizationHeader from "./OrganizationHeader";
import OrganizationSidebar from "./OrganizationSidebar";

interface OrganizationShellProps {
  organizationCode: string;
  organizationName?: string;
  children: ReactNode;
}

export default function OrganizationShell({
  organizationCode,
  organizationName,
  children,
}: OrganizationShellProps) {
  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  return (
    <div
      className="
        min-h-screen
        bg-background
      "
    >
      <OrganizationSidebar
        organizationCode={
          organizationCode
        }
        collapsed={
          sidebarCollapsed
        }
        mobileOpen={
          mobileMenuOpen
        }
        onToggleCollapse={() =>
          setSidebarCollapsed(
            (current) =>
              !current,
          )
        }
        onCloseMobile={() =>
          setMobileMenuOpen(false)
        }
      />

      <div
        className={`
          min-h-screen
          transition-[margin]
          duration-300

          ${
            sidebarCollapsed
              ? "lg:ml-20"
              : "lg:ml-64"
          }
        `}
      >
        <OrganizationHeader
          organizationName={
            organizationName
          }
          onOpenMenu={() =>
            setMobileMenuOpen(true)
          }
        />

        <main
          className="
            p-4
            sm:p-6
            lg:p-8
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}
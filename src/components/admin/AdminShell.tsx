"use client";

import {
  type ReactNode,
  useState,
} from "react";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({
  children,
}: AdminShellProps) {
  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  return (
    <div
      className="
        min-h-screen
        bg-background
      "
    >
      <AdminSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="lg:pl-72">
        <AdminHeader
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main
          className="
            min-h-[calc(100vh-4rem)]
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
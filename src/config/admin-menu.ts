import { Building2, LayoutDashboard } from "lucide-react";
import { globalOrganizationManagement } from "@/lib/auth/workspaces";

export const adminMenu = [
  { label: "Tableau de bord", href: "/dash", icon: LayoutDashboard, permission: globalOrganizationManagement },
  { label: "Organisations", href: "/dash/organisations", icon: Building2, permission: globalOrganizationManagement },
] as const;

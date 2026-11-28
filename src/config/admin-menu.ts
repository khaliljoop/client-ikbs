import { Building2, ClipboardList, LayoutDashboard } from "lucide-react";
import { globalOrganizationManagement, requestReview } from "@/lib/auth/workspaces";

export const adminMenu = [
  { label: "Tableau de bord", href: "/dash", icon: LayoutDashboard, permission: globalOrganizationManagement },
  { label: "Demandes", href: "/dash/demandes", icon: ClipboardList, permission: requestReview },
  { label: "Organisations", href: "/dash/organisations", icon: Building2, permission: globalOrganizationManagement },
  { label: "Référentiel des fonctions", href: "/dash/fonctions", icon: ClipboardList, permission: globalOrganizationManagement },
] as const;

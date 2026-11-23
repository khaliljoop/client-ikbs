import { Gauge } from "lucide-react";
import { organizationRead } from "@/lib/auth/workspaces";
import { organisationRoutes } from "@/config/routes";

export function getOrganizationMenu(organizationCode: string) {
  return [{ key: "dashboard", label: "Profil de l’organisation", href: organisationRoutes.dashboard(organizationCode),
    icon: Gauge, permission: organizationRead }];
}

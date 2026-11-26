import { Gauge, Layers, ShieldCheck, Users } from "lucide-react";
import { organizationRead, rolesAssign, rolesManage } from "@/lib/auth/workspaces";
import { organisationRoutes } from "@/config/routes";

export function getOrganizationMenu(organizationCode: string) {
  return [
    { key: "dashboard", label: "Profil de l’organisation", href: organisationRoutes.dashboard(organizationCode),
      icon: Gauge, permissions: [organizationRead] },
    { key: "members", label: "Membres", href: organisationRoutes.members(organizationCode),
      icon: Users, permissions: [organizationRead] },
    { key: "commissions", label: "Commissions", href: organisationRoutes.commissions(organizationCode),
      icon: Layers, permissions: ["commissions.read"] },
    { key: "roles", label: "Rôles et habilitations", href: organisationRoutes.roles(organizationCode),
      icon: ShieldCheck, permissions: [rolesManage, rolesAssign], section: "Administration" },
  ];
}

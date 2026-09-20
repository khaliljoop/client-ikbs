import {
  CalendarDays,
  CircleDollarSign,
  Gauge,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";

import { organisationRoutes } from "@/config/routes";

export function getOrganizationMenu(
  organizationCode: string,
) {
  return [
    {
      key: "dashboard",
      label: "Tableau de bord",
      href: organisationRoutes.dashboard(
        organizationCode,
      ),
      icon: Gauge,
    },
    {
      key: "members",
      label: "Membres",
      href: organisationRoutes.members(
        organizationCode,
      ),
      icon: Users,
    },
    {
      key: "contributions",
      label: "Cotisations",
      href: organisationRoutes.contributions(
        organizationCode,
      ),
      icon: CircleDollarSign,
    },
    {
      key: "events",
      label: "Événements",
      href: organisationRoutes.events(
        organizationCode,
      ),
      icon: CalendarDays,
    },
    {
      key: "commissions",
      label: "Commissions",
      href: organisationRoutes.commissions(
        organizationCode,
      ),
      icon: UsersRound,
    },
    {
      key: "roles",
      label: "Rôles",
      href: organisationRoutes.roles(
        organizationCode,
      ),
      icon: ShieldCheck,
    },
    {
      key: "settings",
      label: "Paramètres",
      href: organisationRoutes.settings(
        organizationCode,
      ),
      icon: Settings,
    },
  ];
}
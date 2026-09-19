import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

export const adminMenu = [
  {
    label: "Tableau de bord",
    href: "/dash",
    icon: LayoutDashboard,
  },
  {
    label: "Organisations",
    href: "/dash/organisations",
    icon: Building2,
  },
  {
    label: "Demandes d'intégration",
    href: "/dash/demandes",
    icon: ClipboardList,
  },
  {
    label: "Utilisateurs",
    href: "/dash/utilisateurs",
    icon: Users,
  },
  {
    label: "Paramètres",
    href: "/dash/parametres",
    icon: Settings,
  },
] as const;
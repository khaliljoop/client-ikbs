import {
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";

export const organizationMenu = [
  {
    key: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    path: "",
  },
  {
    key: "members",
    label: "Membres",
    icon: Users,
    path: "/membres",
  },
  {
    key: "contributions",
    label: "Cotisations",
    icon: CircleDollarSign,
    path: "/cotisations",
  },
  {
    key: "events",
    label: "Événements",
    icon: CalendarDays,
    path: "/evenements",
  },
  {
    key: "commissions",
    label: "Commissions",
    icon: UsersRound,
    path: "/commissions",
  },
  {
    key: "roles",
    label: "Rôles & profils",
    icon: ShieldCheck,
    path: "/roles",
  },
  {
    key: "settings",
    label: "Paramètres",
    icon: Settings,
    path: "/parametres",
  },
] as const;
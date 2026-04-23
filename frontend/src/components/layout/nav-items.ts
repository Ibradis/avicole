import {
  BarChart3,
  Boxes,
  Building2,
  CircleDollarSign,
  Egg,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Stethoscope,
  Truck,
  Users
} from "lucide-react";
import type { Permission } from "@/types/roles";

export type NavItem = {
  label: string;
  href: string;
  permission: Permission | Permission[];
  icon: React.ComponentType<{ className?: string }>;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", permission: "dashboard.admin", icon: LayoutDashboard },
  { label: "Lots", href: "/lots/1", permission: "ferme.read", icon: Egg },
  { label: "Ventes", href: "/ventes", permission: "ventes.read", icon: ShoppingCart },
  { label: "Achats", href: "/achats", permission: "achats.read", icon: Truck },
  { label: "Stock", href: "/stock", permission: ["ferme.read", "boutique.read"], icon: Boxes },
  { label: "Alimentation", href: "/alimentation", permission: "alimentation.read", icon: Receipt },
  { label: "Santé", href: "/sante", permission: "sante.read", icon: HeartPulse },
  { label: "Vétérinaires", href: "/veterinaires", permission: "sante.read", icon: Stethoscope },
  { label: "COFO", href: "/cofo", permission: "cofo.read", icon: Building2 },
  { label: "Finances", href: "/finances", permission: ["finance.ferme", "finance.boutique"], icon: Landmark },
  { label: "Paiements Interne", href: "/demandes-paiement", permission: ["finance.ferme", "finance.boutique"], icon: CircleDollarSign },
  { label: "Charges", href: "/charges", permission: "charges.read", icon: CircleDollarSign },
  { label: "Partenaires", href: "/partenaires", permission: "partenaires.read", icon: Users },
  { label: "Rapports", href: "/rapports", permission: ["reporting.ferme", "reporting.boutique"], icon: BarChart3 },
  { label: "Administration", href: "/administration", permission: "administration.users", icon: Users }
];

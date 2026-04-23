"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { NAV_ITEMS } from "./nav-items";
import { ROLE_LABELS } from "@/types/roles";
import { Building2, UserCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { API_ROUTES } from "@/lib/api-routes";
import { formatGNF } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const user = useAuthStore((state) => state.user);
  const items = NAV_ITEMS.filter((item) => hasPermission(role, item.permission));

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-[#111827] text-white lg:flex lg:flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-6">
        <div>
          <div className="text-lg font-semibold">Avicole ERP</div>
          <div className="text-xs text-white/55">Architecture financière unifiée</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("/")[1] ? `/${item.href.split("/")[1]}` : item.href);
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white",
                active && "bg-white/12 text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <UserCircle2 className="h-8 w-8 text-white/55" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-white">
                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
              </span>
              <span className="truncate text-xs text-white/55 border-white/20">
                {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}
                {user.entite_type && ` • ${user.entite_type === 'ferme' ? 'Ferme' : 'Boutique'}`}
              </span>
              
              {user.role === 'gerant' && <BoutiqueBalanceBadge />}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function BoutiqueBalanceBadge() {
  const { data, isLoading } = useQuery({
    queryKey: ["tresorerie-consolidée"],
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.finances.tresorerieConsolidee);
      return res.data;
    },
  });

  if (isLoading || !data) return null;

  return (
    <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Caisse : {formatGNF(data.total_solde)}
    </div>
  );
}

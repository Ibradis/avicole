"use client";

import { useQuery } from "@tanstack/react-query";
import { API_ROUTES } from "@/lib/api-routes";
import { apiClient } from "@/lib/axios";
import type { ChartPoint, DashboardResponse, MouvementCaisse } from "@/types/api";
import { useAuthStore } from "@/store/auth-store";

export function useAdminDashboard() {
  const { role, entite_type, entite_id } = useAuthStore();
  
  return useQuery({
    queryKey: ["dashboard", role, entite_type, entite_id],
    queryFn: async () => {
      const url = (entite_type === 'boutique' && entite_id)
        ? `${API_ROUTES.reporting.dashboardBoutique(Number(entite_id))}`
        : API_ROUTES.reporting.dashboardFerme;
        
      const { data } = await apiClient.get<DashboardResponse>(url);
      return data;
    }
  });
}

export function buildRevenueData(mouvements: MouvementCaisse[] = []): ChartPoint[] {
  if (!mouvements.length) return [];

  const grouped = mouvements.reduce<Record<string, MouvementCaisse[]>>((acc, mouvement) => {
    const name = new Date(mouvement.date_mouvement).toLocaleDateString("fr", { month: "short", day: "2-digit" });
    acc[name] = [...(acc[name] ?? []), mouvement];
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, scoped]) => {
    return {
      name,
      recettes: scoped.filter((item) => item.nature === "vente" || item.nature === "vente_cofo").reduce((sum, item) => sum + Number(item.montant), 0),
      charges: scoped.filter((item) => item.nature !== "vente" && item.nature !== "vente_cofo").reduce((sum, item) => sum + Number(item.montant), 0)
    };
  });
}

export function buildProductionData(productionJour?: number): ChartPoint[] {
  return productionJour ? [{ name: "Jour", production: productionJour }] : [];
}

export function buildTresorerieData(liquiditeTotale?: number): ChartPoint[] {
  return liquiditeTotale ? [{ name: "Actuel", tresorerie: liquiditeTotale }] : [];
}

export function buildVentesDonutData(totalVentes?: number, dettesClients?: number) {
  return [
    { name: "CA encaissé", value: Number(totalVentes ?? 0) },
    { name: "Créances clients", value: Number(dettesClients ?? 0) }
  ].filter((item) => item.value > 0);
}

export function buildCofoData(totalAchats?: number, totalVentes?: number): ChartPoint[] {
  if (!totalAchats && !totalVentes) return [];
  return [{ name: "Global", investissement: Number(totalAchats ?? 0), encaissement: Number(totalVentes ?? 0) }];
}

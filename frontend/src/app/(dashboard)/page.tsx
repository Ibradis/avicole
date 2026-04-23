"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Banknote, Boxes, Egg, Receipt, ShoppingCart } from "lucide-react";
import { ExportButtons } from "@/components/shared/export-buttons";
import { DataTable, SortHeader } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { COFOChart, ProductionChart, RevenueChart, StockAlertChart, TresorerieChart, VentesDonut } from "@/components/dashboard/charts";
import { buildCofoData, buildProductionData, buildRevenueData, buildTresorerieData, buildVentesDonutData, useAdminDashboard } from "@/hooks/use-dashboard";
import { API_ROUTES } from "@/lib/api-routes";
import { formatDateFr, formatGNF } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { MouvementCaisse } from "@/types/api";

const movementColumns: ColumnDef<MouvementCaisse>[] = [
  { accessorKey: "date_mouvement", header: ({ column }) => <button onClick={() => column.toggleSorting()}><SortHeader label="Date" /></button>, cell: ({ row }) => formatDateFr(row.original.date_mouvement) },
  { accessorKey: "nature", header: "Nature" },
  { accessorKey: "description", header: "Description", cell: ({ row }) => row.original.description ?? "-" },
  { accessorKey: "montant", header: ({ column }) => <button onClick={() => column.toggleSorting()}><SortHeader label="Montant" /></button>, cell: ({ row }) => formatGNF(row.original.montant) }
];

export default function AdminDashboardPage() {
  const { role } = useAuthStore();
  const { data, isLoading } = useAdminDashboard();
  const kpis = data?.kpis ?? {};
  const mouvements = data?.mouvements_financiers_recents ?? [];
  const alertes = data?.alertes_rupture_stock ?? [];

  const isGerant = role === "gerant";

  return (
    <>
      <PageHeader
        title={isGerant ? "Dashboard boutique" : "Dashboard administrateur"}
        description={isGerant ? "Statistiques et mouvements de votre point de vente." : "Vue consolidée ferme, boutiques, trésorerie, ventes et alertes critiques."}
        actions={<ExportButtons baseName="rapport-tresorerie" pdfUrl={API_ROUTES.exports.reportingPdf("tresorerie")} excelUrl={API_ROUTES.exports.reportingExcel("tresorerie")} />}
      />
      <div className="space-y-6 p-4 lg:p-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard title="Trésorerie totale" value={formatGNF(kpis.liquidite_totale)} icon={Banknote} helper="Ferme + boutiques" isLoading={isLoading} />
          <KpiCard title="Production jour" value={`${kpis.production_jour ?? 0} oeufs`} icon={Egg} helper="Tous lots actifs" isLoading={isLoading} />
          <KpiCard title="CA global" value={formatGNF(kpis.total_ventes)} icon={ShoppingCart} helper="Ventes ferme + boutiques" isLoading={isLoading} />
          <KpiCard title="Achats impayés" value={formatGNF(kpis.achats_impayes ?? kpis.total_achats)} icon={Receipt} helper="Factures à suivre" isLoading={isLoading} />
          <KpiCard title="Stock critique" value={`${alertes.length || kpis.stock_critique || 0}`} icon={Boxes} helper="Sous seuil alerte" isLoading={isLoading} />
          <KpiCard title="Alertes" value={`${alertes.length}`} icon={AlertTriangle} helper="Stock, rapports, factures" isLoading={isLoading} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <RevenueChart data={buildRevenueData(mouvements)} />
          <ProductionChart data={buildProductionData(kpis.production_jour)} />
          <TresorerieChart data={buildTresorerieData(kpis.liquidite_totale)} />
          <VentesDonut data={buildVentesDonutData(kpis.total_ventes, kpis.dettes_clients_ferme)} />
          <StockAlertChart data={alertes} />
          <COFOChart data={buildCofoData(kpis.total_achats, kpis.total_ventes)} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Derniers mouvements financiers</h2>
          <DataTable columns={movementColumns} data={mouvements} isLoading={isLoading} searchPlaceholder="Filtrer les mouvements..." />
        </section>
      </div>
    </>
  );
}

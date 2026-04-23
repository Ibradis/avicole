"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  ArrowUpRight, 
  Banknote, 
  Calendar, 
  History, 
  Info, 
  Loader2, 
  Receipt,
  XCircle 
} from "lucide-react";
import { apiClient } from "@/lib/axios";
import { formatDateFr, formatGNF } from "@/lib/utils";

type ChargeMovement = {
  id: number;
  date: string;
  montant: number;
  description: string;
  portefeuille_nom: string;
  effectue_par: string;
};

type ChargeTypeDetail = {
  id: number;
  nom: string;
  description: string;
  total_depenses: number;
  mouvements: ChargeMovement[];
};

export type ChargeDetailViewProps = {
  endpoint: string;
  id: number;
  onBack: () => void;
};

function Stat({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${color || "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export function ChargeDetailView({ endpoint, id, onBack }: ChargeDetailViewProps) {
  const detailKey = ["charge-detail", id];

  const { data: charge, isLoading, isError } = useQuery<ChargeTypeDetail>({
    queryKey: detailKey,
    queryFn: async () => {
      const res = await apiClient.get(`${endpoint.replace(/\/$/, "")}/${id}/`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Chargement des détails de la charge...</span>
      </div>
    );
  }

  if (isError || !charge) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <XCircle className="h-8 w-8" />
        <span>Impossible de charger cette catégorie de charge.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-10 lg:px-8">
      {/* Header Info */}
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                <Receipt className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{charge.nom}</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl">{charge.description || "Aucune description fournie pour cette catégorie."}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Stat 
              label="Total dépensé" 
              value={formatGNF(charge.total_depenses)} 
              icon={Banknote}
              color="bg-destructive/10 text-destructive"
            />
            <Stat 
              label="Transactions" 
              value={charge.mouvements.length} 
              icon={History}
              color="bg-blue-100 text-blue-600"
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Historique des dépenses</h3>
        </div>
        
        {charge.mouvements.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            Aucun mouvement enregistré pour cette catégorie.
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Portefeuille</th>
                  <th className="px-4 py-3 text-left font-medium">Effectué par</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {charge.mouvements.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDateFr(m.date)}
                    </td>
                    <td className="px-4 py-3 font-medium">{m.portefeuille_nom}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.effectue_par}</td>
                    <td className="px-4 py-3 italic">"{m.description || "—"}"</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-destructive">
                      {formatGNF(m.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted font-bold">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right">TOTAL CUMULÉ</td>
                  <td className="px-4 py-3 text-right font-mono text-destructive">{formatGNF(charge.total_depenses)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 flex gap-3 text-sm text-blue-700">
        <Info className="h-5 w-5 shrink-0" />
        <p>
          Ces données concernent uniquement les mouvements enregistrés comme des <strong>charges</strong>. 
          Les achats de marchandises ou de stocks sont comptabilisés séparément dans le module Achats.
        </p>
      </div>
    </div>
  );
}

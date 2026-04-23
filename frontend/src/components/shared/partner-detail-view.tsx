"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Loader2,
  Phone,
  Mail,
  MapPin,
  ReceiptText,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { apiClient } from "@/lib/axios";
import { formatDateFr, formatGNF } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Invoice = {
  id: number;
  reference: string;
  date: string;
  montant_total: number;
  statut: string;
  statut_paiement: string;
};

type Movement = {
  id: number;
  date: string;
  nature: string;
  montant: number;
  description: string;
  source: string;
  destination: string;
};

type Partner = {
  id: number;
  nom: string;
  type: "client" | "fournisseur";
  telephone?: string;
  email?: string;
  adresse?: string;
  solde_initial: number;
  solde_actuel: number;
  actif: boolean;
  achats: Invoice[];
  ventes: Invoice[];
  mouvements: Movement[];
};

export type PartnerDetailViewProps = {
  endpoint: string;
  id: number;
  onBack: () => void;
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b pb-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-base font-semibold">{children}</h3>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export function PartnerDetailView({ endpoint, id, onBack }: PartnerDetailViewProps) {
  const { data: partner, isLoading, isError } = useQuery<Partner>({
    queryKey: ["partner-detail", endpoint, id],
    queryFn: async () => {
      const res = await apiClient.get(`${endpoint.replace(/\/$/, "")}/${id}/`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Chargement du profil partenaire...</span>
      </div>
    );
  }

  if (isError || !partner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <XCircle className="h-8 w-8" />
        <span>Impossible de charger ce partenaire.</span>
      </div>
    );
  }

  const isClient = partner.type === "client";
  const invoices = isClient ? partner.ventes : partner.achats;
  const totalCA = invoices.reduce((s, i) => s + i.montant_total, 0);
  const totalPaid = invoices.filter(i => i.statut_paiement === "paye").reduce((s, i) => s + i.montant_total, 0);
  const soldePositif = partner.solde_actuel >= 0;

  return (
    <div className="space-y-6 px-4 pb-10 lg:px-8">
      {/* Header Card */}
      <div className="rounded-xl border bg-card shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{partner.nom}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isClient ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                  {isClient ? "Client" : "Fournisseur"}
                </span>
                {!partner.actif && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Inactif</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                {partner.telephone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{partner.telephone}</span>
                )}
                {partner.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{partner.email}</span>
                )}
                {partner.adresse && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{partner.adresse}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Stat
            label="Solde actuel"
            value={
              <span className={soldePositif ? "text-green-600" : "text-destructive"}>
                {formatGNF(partner.solde_actuel)}
              </span>
            }
            sub={`Solde initial : ${formatGNF(partner.solde_initial)}`}
          />
          <Stat
            label={isClient ? "Total ventes" : "Total achats"}
            value={formatGNF(totalCA)}
            sub={`${invoices.length} facture(s)`}
          />
          <Stat
            label="Total encaissé"
            value={<span className="text-green-600">{formatGNF(totalPaid)}</span>}
          />
          <Stat
            label="Mouvements"
            value={partner.mouvements.length}
            sub="transactions liées"
          />
        </div>
      </div>

      {/* Invoices */}
      <div>
        <SectionTitle icon={isClient ? TrendingUp : ShoppingCart}>
          {isClient ? "Factures de vente" : "Factures d'achat"}
        </SectionTitle>
        {invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
            Aucune {isClient ? "vente" : "achat"} enregistré(e) pour ce partenaire.
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Référence</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-center">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{inv.reference}</td>
                    <td className="px-4 py-3">{formatDateFr(inv.date)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatGNF(inv.montant_total)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={inv.statut} /></td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={inv.statut_paiement} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 font-bold text-sm">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right">TOTAL</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{formatGNF(totalCA)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Financial Movements */}
      <div>
        <SectionTitle icon={ReceiptText}>Historique des mouvements financiers</SectionTitle>
        {partner.mouvements.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
            Aucun mouvement financier lié à ce partenaire.
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Nature</th>
                  <th className="px-4 py-3 text-left">Source → Destination</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {partner.mouvements.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateFr(m.date)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                        {m.nature}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{m.source} → {m.destination}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.description || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      <span className={isClient ? "text-green-600" : "text-blue-600"}>
                        {formatGNF(m.montant)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

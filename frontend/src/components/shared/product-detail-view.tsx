"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Box,
  History,
  Info,
  Loader2,
  Package,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { apiClient } from "@/lib/axios";
import { formatDateFr, formatGNF } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Transaction = {
  id: number;
  reference: string;
  date: string;
  fournisseur?: string;
  client?: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  statut: string;
};

type StockMovement = {
  id: number;
  date: string;
  type: "entree" | "sortie";
  quantite: number;
  reference?: string;
  entite: string;
};

type StockLevel = {
  entite: string;
  quantite: number;
  seuil: number;
};

type ProductDetail = {
  id: number;
  nom: string;
  type: string;
  unite: string;
  prix_unitaire: number;
  actif: boolean;
  description?: string;
  achats: Transaction[];
  ventes: Transaction[];
  mouvements_stock: StockMovement[];
  stocks: StockLevel[];
};

export type ProductDetailViewProps = {
  endpoint: string;
  id: number;
  onBack: () => void;
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b pb-2 mb-4">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-base font-semibold tracking-tight">{children}</h3>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, colorClass }: { label: string; value: React.ReactNode; sub?: string; icon?: React.ElementType; colorClass?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1 shadow-sm relative overflow-hidden">
      {Icon && <Icon className={`absolute -right-2 -top-2 h-16 w-16 opacity-5 ${colorClass || "text-primary"}`} />}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${colorClass || ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export function ProductDetailView({ endpoint, id, onBack }: ProductDetailViewProps) {
  const { data: product, isLoading, isError } = useQuery<ProductDetail>({
    queryKey: ["product-detail", id],
    queryFn: async () => {
      const res = await apiClient.get(`${endpoint.replace(/\/$/, "")}/${id}/`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Chargement de la fiche produit...</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <XCircle className="h-8 w-8" />
        <span>Impossible de charger ce produit.</span>
      </div>
    );
  }

  const totalVentesCount = product.ventes.length;
  const totalAchatsCount = product.achats.length;
  const totalStock = product.stocks.reduce((acc, s) => acc + s.quantite, 0);

  return (
    <div className="space-y-6 px-4 pb-10 lg:px-8 max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="rounded-2xl border bg-card shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="rounded-2xl bg-primary/10 p-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight">{product.nom}</h2>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-muted text-muted-foreground uppercase tracking-wide">
                  {product.type}
                </span>
                {!product.actif && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-destructive/10 text-destructive uppercase tracking-wide">
                    Inactif
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                {product.description || "Aucune description fournie pour ce produit."}
              </p>
              <div className="flex gap-4 mt-4 text-sm font-medium">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>Prix : {formatGNF(product.prix_unitaire)} / {product.unite}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <StatCard
            label="Stock Total"
            value={`${totalStock} ${product.unite}`}
            icon={Box}
            colorClass="text-blue-600"
          />
          <StatCard
            label="Prix Unitaire"
            value={formatGNF(product.prix_unitaire)}
            icon={TrendingUp}
            colorClass="text-primary"
          />
          <StatCard
            label="Ventes liées"
            value={totalVentesCount}
            sub="Transactions"
            icon={ArrowUpCircle}
            colorClass="text-green-600"
          />
          <StatCard
            label="Achats liés"
            value={totalAchatsCount}
            sub="Ravitaillements"
            icon={ArrowDownCircle}
            colorClass="text-orange-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stocks per Entity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <SectionTitle icon={Box}>État des stocks par lieu</SectionTitle>
            {product.stocks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">Pas de stock enregistré.</p>
            ) : (
              <div className="space-y-4">
                {product.stocks.map((s, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 rounded-xl border bg-muted/30">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">{s.entite}</span>
                      <span className={`font-mono font-bold ${s.quantite <= s.seuil ? 'text-destructive' : 'text-blue-600'}`}>
                        {s.quantite} {product.unite}
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                       <div 
                        className={`h-full rounded-full ${s.quantite <= s.seuil ? 'bg-destructive' : 'bg-blue-500'}`} 
                        style={{ width: `${Math.min(100, (s.quantite / (s.seuil || 1)) * 10)}%` }}
                       />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Seuil d'alerte : {s.seuil}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="mouvements" className="w-full">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="bg-muted p-1">
                <TabsTrigger value="mouvements" className="gap-2"><History className="h-4 w-4" /> Stock</TabsTrigger>
                <TabsTrigger value="ventes" className="gap-2"><ArrowUpCircle className="h-4 w-4" /> Ventes</TabsTrigger>
                <TabsTrigger value="achats" className="gap-2"><ArrowDownCircle className="h-4 w-4" /> Achats</TabsTrigger>
              </TabsList>
            </div>

            {/* TAB: STOCK MOVEMENTS */}
            <TabsContent value="mouvements" className="m-0">
              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Lieu</th>
                      <th className="px-4 py-3 text-right">Quantité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {product.mouvements_stock.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDateFr(m.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${m.type === 'entree' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {m.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">{m.entite}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${m.type === 'entree' ? 'text-green-600' : 'text-destructive'}`}>
                          {m.type === 'entree' ? '+' : '-'}{m.quantite}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {product.mouvements_stock.length === 0 && (
                  <p className="p-8 text-center text-muted-foreground">Aucun mouvement de stock enregistré.</p>
                )}
              </div>
            </TabsContent>

            {/* TAB: VENTES */}
            <TabsContent value="ventes" className="m-0">
              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Ref</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Client</th>
                      <th className="px-4 py-3 text-right">Qté</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {product.ventes.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-semibold text-xs">{v.reference}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDateFr(v.date)}</td>
                        <td className="px-4 py-3 text-xs">{v.client}</td>
                        <td className="px-4 py-3 text-right font-mono">{v.quantite}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-green-600">{formatGNF(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {product.ventes.length === 0 && (
                  <p className="p-8 text-center text-muted-foreground">Aucune vente enregistrée pour ce produit.</p>
                )}
              </div>
            </TabsContent>

            {/* TAB: ACHATS */}
            <TabsContent value="achats" className="m-0">
              <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Ref</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Fournisseur</th>
                      <th className="px-4 py-3 text-right">Qté</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {product.achats.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-semibold text-xs">{a.reference}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDateFr(a.date)}</td>
                        <td className="px-4 py-3 text-xs">{a.fournisseur}</td>
                        <td className="px-4 py-3 text-right font-mono">{a.quantite}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-orange-600">{formatGNF(a.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {product.achats.length === 0 && (
                  <p className="p-8 text-center text-muted-foreground">Aucun achat enregistré pour ce produit.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

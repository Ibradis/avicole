"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  ChefHat,
  ClipboardList,
  HeartPulse,
  History,
  Loader2,
  Skull,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { apiClient } from "@/lib/axios";
import { formatDateFr } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Production = {
  id: number;
  date: string;
  plateaux: number;
  unites: number;
  casses: number;
};

type Mortality = {
  id: number;
  date: string;
  quantite: number;
  cause?: string;
};

type Vaccination = {
  id: number;
  date: string;
  produit: string;
  methode?: string;
};

type Treatment = {
  id: number;
  date_debut: string;
  date_fin?: string;
  produit: string;
  posologie?: string;
};

type Consumption = {
  id: number;
  date: string;
  produit: string;
  quantite: number;
};

type LotDetail = {
  id: number;
  code: string;
  date_arrivee: string;
  quantite_initiale: number;
  quantite_actuelle: number;
  souche?: string;
  origine?: string;
  actif: boolean;
  productions: Production[];
  mortalites: Mortality[];
  vaccinations: Vaccination[];
  traitements: Treatment[];
  consommations: Consumption[];
  total_morts: number;
  taux_mortalite: number;
  age_jours: number;
  age_semaines: number;
};

export type LotDetailViewProps = {
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

function StatCard({ label, value, sub, icon: Icon, colorClass, progress }: { label: string; value: React.ReactNode; sub?: string; icon?: React.ElementType; colorClass?: string; progress?: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2 shadow-sm relative overflow-hidden">
      {Icon && <Icon className={`absolute -right-2 -top-2 h-16 w-16 opacity-5 ${colorClass || "text-primary"}`} />}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${colorClass || ""}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>}
      {progress !== undefined && <Progress value={progress} className="h-1 mt-2" />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export function LotDetailView({ endpoint, id, onBack }: LotDetailViewProps) {
  const { data: lot, isLoading, isError } = useQuery<LotDetail>({
    queryKey: ["lot-detail", id],
    queryFn: async () => {
      const res = await apiClient.get(`${endpoint.replace(/\/$/, "")}/${id}/`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Chargement du dossier lot...</span>
      </div>
    );
  }

  if (isError || !lot) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <XCircle className="h-8 w-8" />
        <span>Impossible de charger ce lot.</span>
      </div>
    );
  }

  const survieRate = 100 - lot.taux_mortalite;
  const totalProduction = lot.productions.reduce((acc, p) => acc + p.unites, 0);

  return (
    <div className="space-y-6 px-4 pb-10 lg:px-8 max-w-6xl mx-auto">
      {/* Header Info */}
      <div className="rounded-2xl border bg-card shadow-sm p-6 relative overflow-hidden bg-gradient-to-br from-card to-muted/20">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="rounded-2xl bg-indigo-500/10 p-4 border border-indigo-500/20">
              <ClipboardList className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight">Lot {lot.code}</h2>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${lot.actif ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"}`}>
                  {lot.actif ? "En cours" : "Clôturé"}
                </span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Arrivée : {formatDateFr(lot.date_arrivee)}</span>
                <span className="flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> Souche : {lot.souche || "N/A"}</span>
                {lot.origine && <span className="flex items-center gap-1 border-l pl-4">Origine : {lot.origine}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Vital Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <StatCard
            label="Effectif Actuel"
            value={`${lot.quantite_actuelle} têtes`}
            sub={`Initial: ${lot.quantite_initiale}`}
            icon={TrendingUp}
            colorClass="text-indigo-600"
            progress={(lot.quantite_actuelle / lot.quantite_initiale) * 100}
          />
          <StatCard
            label="Âge du Lot"
            value={`${lot.age_semaines} sem.`}
            sub={`${lot.age_jours} jours d'élevage`}
            icon={Calendar}
            colorClass="text-blue-600"
          />
          <StatCard
            label="Taux Mortalité"
            value={`${lot.taux_mortalite}%`}
            sub={`${lot.total_morts} pertes cumulées`}
            icon={Skull}
            colorClass="text-destructive"
            progress={lot.taux_mortalite}
          />
          <StatCard
            label="Taux de Survie"
            value={`${survieRate.toFixed(1)}%`}
            sub="Santé globale du lot"
            icon={HeartPulse}
            colorClass="text-green-600"
            progress={survieRate}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Areas */}
        <div className="lg:col-span-12">
          <Tabs defaultValue="sante" className="w-full">
            <TabsList className="bg-muted/50 p-1 mb-6 border w-full justify-start overflow-x-auto">
              <TabsTrigger value="sante" className="gap-2 shrink-0"><Stethoscope className="h-4 w-4" /> Carnet de Santé</TabsTrigger>
              <TabsTrigger value="production" className="gap-2 shrink-0"><TrendingUp className="h-4 w-4" /> Production</TabsTrigger>
              <TabsTrigger value="alimentation" className="gap-2 shrink-0"><ChefHat className="h-4 w-4" /> Alimentation</TabsTrigger>
              <TabsTrigger value="pertes" className="gap-2 shrink-0"><TrendingDown className="h-4 w-4" /> Mortalités</TabsTrigger>
            </TabsList>

            {/* TAB: HEALTH CARNET */}
            <TabsContent value="sante" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Vaccinations */}
                <div className="rounded-2xl border bg-card shadow-sm p-5 overflow-hidden">
                  <SectionTitle icon={HeartPulse}>Vaccinations effectuées</SectionTitle>
                  <div className="space-y-3">
                    {lot.vaccinations.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">Aucun vaccin enregistré.</p>
                    ) : (
                      lot.vaccinations.map((v) => (
                        <div key={v.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-all">
                          <div>
                            <p className="text-sm font-bold">{v.produit}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{v.methode || "Détails non spécifiés"}</p>
                          </div>
                          <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">{formatDateFr(v.date)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {/* Traitements */}
                <div className="rounded-2xl border bg-card shadow-sm p-5 overflow-hidden">
                  <SectionTitle icon={Stethoscope}>Soins & Traitements</SectionTitle>
                  <div className="space-y-3">
                    {lot.traitements.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">Aucun traitement en cours.</p>
                    ) : (
                      lot.traitements.map((t) => (
                        <div key={t.id} className="flex flex-col gap-1 p-3 rounded-xl bg-orange-50/30 border border-orange-100 hover:border-orange-200">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-orange-800">{t.produit}</p>
                            <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded shadow-sm">{formatDateFr(t.date_debut)}</span>
                          </div>
                          <p className="text-xs text-orange-700/80">{t.posologie || "Standard"}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: PRODUCTION */}
            <TabsContent value="production">
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="p-5 border-b bg-muted/20 flex justify-between items-center">
                  <SectionTitle icon={TrendingUp}>Historique de ponte</SectionTitle>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Cumul Total</p>
                    <p className="text-lg font-bold text-primary">{totalProduction} œufs</p>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-center">Plateaux</th>
                      <th className="px-6 py-3 text-center">Unités</th>
                      <th className="px-6 py-3 text-center text-destructive">Casses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lot.productions.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 group">
                        <td className="px-6 py-3 font-medium">{formatDateFr(p.date)}</td>
                        <td className="px-6 py-3 text-center font-mono">{p.plateaux}</td>
                        <td className="px-6 py-3 text-center font-mono font-bold text-blue-600">{p.unites}</td>
                        <td className="px-6 py-3 text-center font-mono text-destructive">{p.casses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lot.productions.length === 0 && <p className="p-10 text-center text-muted-foreground italic text-sm">Ce lot ne produit pas encore (ou données non saisies).</p>}
              </div>
            </TabsContent>

            {/* TAB: FEEDING */}
            <TabsContent value="alimentation">
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Aliment</th>
                      <th className="px-6 py-3 text-right">Quantité Saisie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lot.consommations.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-6 py-3 font-medium">{formatDateFr(c.date)}</td>
                        <td className="px-6 py-3">{c.produit}</td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-orange-600">{c.quantite} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lot.consommations.length === 0 && <p className="p-10 text-center text-muted-foreground italic text-sm">Aucun log d'alimentation enregistré.</p>}
              </div>
            </TabsContent>

            {/* TAB: MORTALITY */}
            <TabsContent value="pertes">
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden border-destructive/20">
                <div className="p-5 border-b bg-destructive/5">
                   <SectionTitle icon={Skull}>Registre des Pertes</SectionTitle>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-center">Quantité</th>
                      <th className="px-6 py-3 text-left">Cause probable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lot.mortalites.map((m) => (
                      <tr key={m.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-6 py-3 font-medium">{formatDateFr(m.date)}</td>
                        <td className="px-6 py-3 text-center font-mono font-bold text-destructive">-{m.quantite}</td>
                        <td className="px-6 py-3 italic text-muted-foreground">{m.cause || "Non spécifiée"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lot.mortalites.length === 0 && <p className="p-10 text-center text-muted-foreground italic text-sm">Zéro mortalité enregistrée. Excellent !</p>}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

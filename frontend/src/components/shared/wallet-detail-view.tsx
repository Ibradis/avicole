"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  Loader2,
  RefreshCcw,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/axios";
import { formatDateFr, formatGNF, unwrapResults } from "@/lib/utils";
import { API_ROUTES } from "@/lib/api-routes";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Movement = {
  id: number;
  date: string;
  nature: string;
  direction: "entree" | "sortie";
  montant: number;
  description: string;
  contrepartie: string;
  reference_table: string;
  reference_id?: number;
};

type Wallet = {
  id: number;
  nom: string;
  type: "caisse" | "banque";
  entite_type?: string;
  entite_id?: number;
  entite_nom?: string;
  solde_init: number;
  solde_actuel: number;
  nom_banque?: string;
  numero_compte?: string;
  titulaire?: string;
  devise: string;
  statut: string;
  mouvements: Movement[];
};

export type WalletDetailViewProps = {
  endpoint: string;
  id: number;
  onBack: () => void;
};

type ActionType = "transfert" | "payer_fournisseur" | "charge" | "depot" | null;

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

function Stat({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${accent || ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Transfer Modal
───────────────────────────────────────────── */
function TransferModal({
  open,
  onClose,
  wallet,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  wallet: Wallet;
  onSuccess: () => void;
}) {
  const [destId, setDestId] = useState("");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const today = new Date().toISOString().split("T")[0];

  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ["wallets-list"],
    queryFn: async () => {
      const res = await apiClient.get(`${API_ROUTES.finances.portefeuilles}?include_all=true`);
      return unwrapResults(res.data);
    },
  });

  const mutation = useMutation({
    mutationFn: async () =>
      apiClient.post(API_ROUTES.finances.transfert, {
        source_id: wallet.id,
        dest_id: Number(destId),
        montant: Number(montant),
        date_mouvement: date,
        description: description || `Transfert ${wallet.nom} → ${wallets.find(w => w.id === Number(destId))?.nom}`,
      }),
    onSuccess: () => {
      toast.success("Transfert effectué avec succès");
      onSuccess();
      onClose();
      setMontant(""); setDestId(""); setDescription("");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Erreur lors du transfert"),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!destId || !montant) return;
    mutation.mutate();
  };

  const otherWallets = wallets.filter(w => w.id !== wallet.id);

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfert vers un autre portefeuille</DialogTitle>
          <DialogDescription>Depuis : <strong>{wallet.nom}</strong> (solde : {formatGNF(wallet.solde_actuel)})</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Destination</Label>
              <Select value={destId} onValueChange={setDestId} required>
                <SelectTrigger><SelectValue placeholder="Choisir un portefeuille..." /></SelectTrigger>
                <SelectContent>
                  {otherWallets.map(w => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.nom} — {formatGNF(w.solde_actuel)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Montant (GNF)</Label>
              <Input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0" required min={1} max={wallet.solde_actuel} />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} required />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optionnel)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Objet du transfert..." />
            </div>
          </DialogBody>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Effectuer le transfert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   Pay Supplier Modal
───────────────────────────────────────────── */
function PaySupplierModal({
  open,
  onClose,
  wallet,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  wallet: Wallet;
  onSuccess: () => void;
}) {
  const [achatsId, setAchatsId] = useState("");
  const [montant, setMontant] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const { data: achats = [] } = useQuery<any[]>({
    queryKey: ["achats-list"],
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.achats);
      return unwrapResults(res.data);
    },
    enabled: open,
  });

  const pendingAchats = achats.filter(a => a.statut === "valide" && a.statut_paiement !== "paye");

  const mutation = useMutation({
    mutationFn: async () =>
      apiClient.post(`${API_ROUTES.achats}${achatsId}/payer/`, {
        montant: Number(montant),
        portefeuille_id: wallet.id,
      }),
    onSuccess: () => {
      toast.success("Paiement fournisseur enregistré");
      onSuccess();
      onClose();
      setMontant(""); setAchatsId("");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Erreur lors du paiement"),
  });

  const selectedAchat = achats.find(a => String(a.id) === achatsId);

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payer un fournisseur</DialogTitle>
          <DialogDescription>Depuis : <strong>{wallet.nom}</strong> (solde : {formatGNF(wallet.solde_actuel)})</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
          <DialogBody className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Facture d'achat (non payée)</Label>
              <Select value={achatsId} onValueChange={setAchatsId} required>
                <SelectTrigger><SelectValue placeholder="Choisir une facture..." /></SelectTrigger>
                <SelectContent>
                  {pendingAchats.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.reference || `ACHAT-${a.id}`} — {a.fournisseur_nom} — {formatGNF(a.montant_total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedAchat && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Fournisseur :</span> <strong>{selectedAchat.fournisseur_nom}</strong></p>
                <p><span className="text-muted-foreground">Montant total :</span> <strong>{formatGNF(selectedAchat.montant_total)}</strong></p>
                <p><span className="text-muted-foreground">Statut paiement :</span> <strong>{selectedAchat.statut_paiement}</strong></p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Montant du versement (GNF)</Label>
              <Input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0" required min={1} />
            </div>
          </DialogBody>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enregistrer le paiement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   Expense Modal (Enregistrer une charge)
───────────────────────────────────────────── */
function ExpenseModal({
  open,
  onClose,
  wallet,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  wallet: Wallet;
  onSuccess: () => void;
}) {
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [typeChargeId, setTypeChargeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const today = new Date().toISOString().split("T")[0];

  const { data: chargeTypes = [] } = useQuery<any[]>({
    queryKey: ["charge-types"],
    queryFn: async () => {
      const res = await apiClient.get(API_ROUTES.charges.types);
      return unwrapResults(res.data);
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () =>
      apiClient.post(API_ROUTES.finances.mouvements, {
        source_type: "portefeuille",
        source_id: wallet.id,
        dest_type: "tiers",
        nature: "charge",
        montant: Number(montant),
        date_mouvement: date,
        description: description,
        id_type_charge: typeChargeId ? Number(typeChargeId) : null,
      }),
    onSuccess: () => {
      toast.success("Dépense enregistrée avec succès");
      onSuccess();
      onClose();
      setMontant(""); setTypeChargeId(""); setDescription("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "Erreur lors de l'enregistrement de la charge";
      toast.error(msg);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!montant || !date) return;
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer une dépense / charge</DialogTitle>
          <DialogDescription>
            Sortie de fonds depuis : <strong>{wallet.nom}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Catégorie de charge (optionnel)</Label>
              <Select value={typeChargeId} onValueChange={setTypeChargeId}>
                <SelectTrigger><SelectValue placeholder="Choisir un type..." /></SelectTrigger>
                <SelectContent>
                  {chargeTypes.map(ct => (
                    <SelectItem key={ct.id} value={String(ct.id)}>{ct.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Montant (GNF)</Label>
              <Input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0" required min={1} max={wallet.solde_actuel} />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} required />
            </div>
            <div className="space-y-1.5">
              <Label>Description / Motif</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Achat fournitures, facture électricité..." required />
            </div>
          </DialogBody>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending} variant="destructive">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmer la dépense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export function WalletDetailView({ endpoint, id, onBack }: WalletDetailViewProps) {
  const queryClient = useQueryClient();
  const detailKey = ["wallet-detail", endpoint, id];
  const [action, setAction] = useState<ActionType>(null);

  const { data: wallet, isLoading, isError } = useQuery<Wallet>({
    queryKey: detailKey,
    queryFn: async () => {
      const res = await apiClient.get(`${endpoint.replace(/\/$/, "")}/${id}/`);
      return res.data;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: detailKey });
    queryClient.invalidateQueries({ queryKey: ["wallets-list"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Chargement du portefeuille...</span>
      </div>
    );
  }

  if (isError || !wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <XCircle className="h-8 w-8" />
        <span>Impossible de charger ce portefeuille.</span>
      </div>
    );
  }

  const WalletIcon = wallet.type === "banque" ? Landmark : Banknote;
  const totalEntrees = wallet.mouvements.filter(m => m.direction === "entree").reduce((s, m) => s + m.montant, 0);
  const totalSorties = wallet.mouvements.filter(m => m.direction === "sortie").reduce((s, m) => s + m.montant, 0);

  return (
    <div className="space-y-6 px-4 pb-10 lg:px-8">
      {/* Header */}
      <div className="rounded-xl border bg-card shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <WalletIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{wallet.nom}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${wallet.type === "banque" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                  {wallet.type === "banque" ? "Banque" : "Caisse"}
                </span>
              </div>
              {wallet.nom_banque && <p className="text-sm text-muted-foreground mt-0.5">{wallet.nom_banque} — {wallet.numero_compte}</p>}
              {wallet.titulaire && <p className="text-xs text-muted-foreground">Titulaire : {wallet.titulaire}</p>}
              <p className="text-sm text-primary font-medium mt-1 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {wallet.entite_nom || "Organisation"}
              </p>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setAction("transfert")} className="gap-1.5">
              <Send className="h-4 w-4" /> Transfert
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAction("payer_fournisseur")} className="gap-1.5">
              <Users className="h-4 w-4" /> Payer fournisseur
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAction("charge")} className="gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/5">
              <ArrowUpRight className="h-4 w-4" /> Enregistrer une dépense
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Stat
            label="Solde actuel"
            value={formatGNF(wallet.solde_actuel)}
            accent={wallet.solde_actuel >= 0 ? "text-green-600" : "text-destructive"}
            sub={`Solde initial : ${formatGNF(wallet.solde_init)}`}
          />
          <Stat
            label="Total entrées"
            value={<span className="text-green-600">{formatGNF(totalEntrees)}</span>}
            sub={`${wallet.mouvements.filter(m => m.direction === "entree").length} mvt(s)`}
          />
          <Stat
            label="Total sorties"
            value={<span className="text-destructive">{formatGNF(totalSorties)}</span>}
            sub={`${wallet.mouvements.filter(m => m.direction === "sortie").length} mvt(s)`}
          />
          <Stat
            label="Mouvements"
            value={wallet.mouvements.length}
            sub="100 derniers affichés"
          />
        </div>
      </div>

      {/* Movement Ledger */}
      <div>
        <SectionTitle icon={RefreshCcw}>Historique des mouvements</SectionTitle>
        {wallet.mouvements.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
            Aucun mouvement enregistré pour ce portefeuille.
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Nature</th>
                  <th className="px-4 py-3 text-left">Contrepartie</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Entrée</th>
                  <th className="px-4 py-3 text-right">Sortie</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {wallet.mouvements.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateFr(m.date)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                        {m.direction === "entree"
                          ? <ArrowDownLeft className="h-3 w-3 text-green-600" />
                          : <ArrowUpRight className="h-3 w-3 text-destructive" />}
                        {m.nature}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{m.contrepartie}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{m.description || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-green-600">
                      {m.direction === "entree" ? formatGNF(m.montant) : ""}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-destructive">
                      {m.direction === "sortie" ? formatGNF(m.montant) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 font-bold text-sm">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right">TOTAUX</td>
                  <td className="px-4 py-3 text-right font-mono text-green-600">{formatGNF(totalEntrees)}</td>
                  <td className="px-4 py-3 text-right font-mono text-destructive">{formatGNF(totalSorties)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <TransferModal
        open={action === "transfert"}
        onClose={() => setAction(null)}
        wallet={wallet}
        onSuccess={refresh}
      />
      <PaySupplierModal
        open={action === "payer_fournisseur"}
        onClose={() => setAction(null)}
        wallet={wallet}
        onSuccess={refresh}
      />
      <ExpenseModal
        open={action === "charge"}
        onClose={() => setAction(null)}
        wallet={wallet}
        onSuccess={refresh}
      />
    </div>
  );
}

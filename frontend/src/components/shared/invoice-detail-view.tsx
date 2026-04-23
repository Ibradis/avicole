"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Printer,
  ReceiptText,
  Truck,
  XCircle,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { apiClient } from "@/lib/axios";
import { formatDateFr, formatGNF, unwrapResults } from "@/lib/utils";
import type { ResourceAction } from "@/components/shared/api-resource-page";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type InvoiceLine = {
  id: number;
  produit_nom: string;
  quantite: number;
  prix_unitaire: number;
  sous_total: number;
};

type Payment = {
  id: number;
  date: string;
  montant: number;
  caisse: string;
  description: string;
};

type Invoice = {
  id: number;
  reference?: string;
  statut: string;
  statut_paiement: string;
  montant_total: number;
  date_achat?: string;
  date_vente?: string;
  date_reception?: string;
  date_livraison?: string;
  fournisseur_nom?: string;
  client_nom?: string;
  destinataire_nom?: string;
  observations?: string;
  lignes: InvoiceLine[];
  mouvements: Payment[];
};

type InvoiceDetailViewProps = {
  endpoint: string;
  id: number;
  type: "achat" | "vente";
  onBack: () => void;
  actions?: ResourceAction[];
  auth?: any;
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

function InfoField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Action Fields Input
───────────────────────────────────────────── */
function ActionFieldInput({ field, values, onChange }: {
  field: any;
  values: Record<string, string>;
  onChange: (name: string, val: string) => void;
}) {
  const resource = typeof field.remoteResource === "function" ? field.remoteResource(values) : field.remoteResource;
  const { data: remoteOptions = [] } = useQuery<{ id: number; [key: string]: any }[]>({
    queryKey: ["remote", resource],
    queryFn: async () => {
      if (!resource) return [];
      const res = await apiClient.get(resource);
      return unwrapResults(res.data);
    },
    enabled: !!resource,
  });

  if (resource) {
    return (
      <Select value={values[field.name] || ""} onValueChange={(v) => onChange(field.name, v)}>
        <SelectTrigger id={`action-field-${field.name}`}>
          <SelectValue placeholder={field.label} />
        </SelectTrigger>
        <SelectContent>
          {remoteOptions.map((opt) => (
            <SelectItem key={opt.id} value={String(opt.id)}>
              {opt[field.remoteLabel || "nom"] || opt.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      id={`action-field-${field.name}`}
      type={field.type === "number" ? "number" : "text"}
      value={values[field.name] || ""}
      onChange={(e) => onChange(field.name, e.target.value)}
      placeholder={field.placeholder}
      required={field.required}
    />
  );
}

/* ─────────────────────────────────────────────
   Printable Receipt
───────────────────────────────────────────── */
function PrintableInvoice({ invoice, type }: { invoice: Invoice; type: "achat" | "vente" }) {
  const docTitle = type === "achat"
    ? (invoice.statut === "valide" ? "BON DE RÉCEPTION" : "BON DE COMMANDE")
    : (invoice.statut === "valide" ? "BON DE LIVRAISON" : "PROFORMA");

  const partner = invoice.destinataire_nom || invoice.fournisseur_nom || invoice.client_nom || "—";
  const dateDoc = invoice.date_achat || invoice.date_vente;
  const dateValid = invoice.date_reception || invoice.date_livraison;

  return (
    <div className="hidden print:block p-8 text-black text-sm font-sans">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{docTitle}</h1>
          <p className="text-sm text-gray-500">#{invoice.reference || invoice.id}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Date : {formatDateFr(dateDoc)}</p>
          {dateValid && <p className="text-gray-500">Date validation : {formatDateFr(dateValid)}</p>}
        </div>
      </div>
      <div className="border rounded p-3 mb-6 inline-block">
        <p className="text-xs text-gray-500">{type === "achat" ? "Fournisseur" : "Client"}</p>
        <p className="font-semibold text-base">{partner}</p>
      </div>
      <table className="w-full border-collapse text-sm mb-6">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 pr-4">Produit</th>
            <th className="text-right py-2 pr-4">Qté</th>
            <th className="text-right py-2 pr-4">Prix unitaire</th>
            <th className="text-right py-2">Sous-total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lignes.map((l, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-1.5 pr-4">{l.produit_nom}</td>
              <td className="py-1.5 pr-4 text-right">{l.quantite}</td>
              <td className="py-1.5 pr-4 text-right">{formatGNF(l.prix_unitaire)}</td>
              <td className="py-1.5 text-right font-medium">{formatGNF(l.sous_total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-bold">
            <td colSpan={3} className="pt-2 text-right">TOTAL</td>
            <td className="pt-2 text-right">{formatGNF(invoice.montant_total)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="flex justify-between mt-12">
        <div><p className="border-b border-black w-48 mb-1"></p><p className="text-xs text-center">{type === "achat" ? "Fournisseur" : "Client"}</p></div>
        <div><p className="border-b border-black w-48 mb-1"></p><p className="text-xs text-center">Responsable</p></div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Action Modal
───────────────────────────────────────────── */
function ActionModal({
  open,
  action,
  invoice,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  action: ResourceAction | null;
  invoice: Invoice;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
  isPending: boolean;
}) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  if (!action) return null;

  const handleChange = (name: string, val: string) => setFieldValues(prev => ({ ...prev, [name]: val }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(fieldValues);
    setFieldValues({});
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action.label}</DialogTitle>
          {action.description && <DialogDescription>{action.description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4 py-2">
            {(action.fields || []).map(field => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={`action-field-${field.name}`}>{field.label}</Label>
                <ActionFieldInput field={field} values={fieldValues} onChange={handleChange} />
              </div>
            ))}
          </DialogBody>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {action.submitLabel || "Confirmer"}
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
export function InvoiceDetailView({ endpoint, id, type, onBack, actions = [], auth }: InvoiceDetailViewProps) {
  const queryClient = useQueryClient();
  const detailQueryKey = ["invoice-detail", endpoint, id];
  const [activeAction, setActiveAction] = useState<ResourceAction | null>(null);

  const { data: invoice, isLoading, isError } = useQuery<Invoice>({
    queryKey: detailQueryKey,
    queryFn: async () => {
      const url = `${endpoint.replace(/\/$/, "")}/${id}/`;
      const res = await apiClient.get(url);
      return res.data;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, values }: { action: ResourceAction; values?: Record<string, any> }) => {
      if (!invoice) return;
      const act = action.action(invoice as any, values);
      if (act.method === "patch") return apiClient.patch(act.url, act.payload ?? {});
      return apiClient.post(act.url, act.payload ?? {});
    },
    onSuccess: (_, { action }) => {
      toast.success(action.successMessage || "Action effectuée avec succès");
      setActiveAction(null);
      // Refresh both the detail and the list
      queryClient.invalidateQueries({ queryKey: detailQueryKey });
      queryClient.invalidateQueries({ queryKey: ["resource", endpoint] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.error || "Une erreur est survenue";
      toast.error(msg);
    }
  });

  const handleActionClick = (action: ResourceAction) => {
    if (action.fields && action.fields.length > 0) {
      setActiveAction(action);
    } else {
      actionMutation.mutate({ action });
    }
  };

  const visibleActions = invoice
    ? actions.filter(a => !a.show || a.show(invoice as any, auth))
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Chargement des détails...</span>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <XCircle className="h-8 w-8" />
        <span>Impossible de charger les détails de cette facture.</span>
      </div>
    );
  }

  const partner = invoice.destinataire_nom || invoice.fournisseur_nom || invoice.client_nom;
  const dateDoc = invoice.date_achat || invoice.date_vente;
  const dateValid = invoice.date_reception || invoice.date_livraison;
  const totalPaid = (invoice.mouvements || []).reduce((s, m) => s + m.montant, 0);
  const restant = invoice.montant_total - totalPaid;

  return (
    <>
      <PrintableInvoice invoice={invoice} type={type} />

      <div className="print:hidden space-y-6 px-4 pb-10 lg:px-8">
        {/* Header Card */}
        <div className="rounded-xl border bg-card shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                {type === "achat" ? "Facture Achat" : "Facture Vente"}
              </p>
              <h2 className="text-xl font-bold">{invoice.reference || `#${invoice.id}`}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {partner ? `${type === "achat" ? "Fournisseur" : "Destinataire"} : ${partner}` : ""}
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <div className="flex gap-2">
                <StatusBadge status={invoice.statut} />
                <StatusBadge status={invoice.statut_paiement} />
              </div>
              {/* Action Buttons */}
              {visibleActions.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-end mt-1">
                  {visibleActions.map(action => {
                    const Icon = action.icon;
                    const isPending = actionMutation.isPending && activeAction?.id === action.id;
                    return (
                      <Button
                        key={action.id}
                        size="sm"
                        variant={action.variant || "outline"}
                        onClick={() => handleActionClick(action)}
                        disabled={actionMutation.isPending}
                        className="gap-1.5"
                      >
                        {isPending
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : Icon ? <Icon className="h-3.5 w-3.5" /> : null
                        }
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t">
            <InfoField label="Date" value={formatDateFr(dateDoc)} />
            <InfoField label={type === "achat" ? "Date réception" : "Date livraison"} value={dateValid ? formatDateFr(dateValid) : "Non définie"} />
            <InfoField label="Montant total" value={<span className="text-lg font-bold text-primary">{formatGNF(invoice.montant_total)}</span>} />
            <InfoField label="Restant à régler" value={
              <span className={`text-lg font-bold ${restant > 0 ? "text-destructive" : "text-green-600"}`}>
                {formatGNF(Math.max(restant, 0))}
              </span>
            } />
          </div>
          {invoice.observations && (
            <div className="mt-3 pt-3 border-t">
              <InfoField label="Observations" value={invoice.observations} />
            </div>
          )}
        </div>

        {/* Product Lines */}
        <div>
          <SectionTitle icon={Package}>
            {type === "achat" ? "Produits achetés" : "Produits vendus"}
          </SectionTitle>
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Produit</th>
                  <th className="px-4 py-3 text-right">Qté</th>
                  <th className="px-4 py-3 text-right">Prix unitaire</th>
                  <th className="px-4 py-3 text-right">Sous-total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.lignes.map((line, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{line.produit_nom}</td>
                    <td className="px-4 py-3 text-right">{line.quantite}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatGNF(line.prix_unitaire)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatGNF(line.sous_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-primary/5 font-bold text-sm">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right">TOTAL FACTURE</td>
                  <td className="px-4 py-3 text-right font-mono text-primary text-base">{formatGNF(invoice.montant_total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment History */}
        <div>
          <SectionTitle icon={ReceiptText}>Historique des paiements</SectionTitle>
          {(!invoice.mouvements || invoice.mouvements.length === 0) ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucun paiement enregistré pour cette facture.</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Caisse / Banque</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.mouvements.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{formatDateFr(m.date)}</td>
                      <td className="px-4 py-3 font-medium">{m.caisse}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.description || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-green-600">{formatGNF(m.montant)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 font-bold text-sm">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right">TOTAL PAYÉ</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600">{formatGNF(totalPaid)}</td>
                  </tr>
                  {restant > 0 && (
                    <tr className="text-destructive">
                      <td colSpan={3} className="px-4 py-3 text-right">RESTE À PAYER</td>
                      <td className="px-4 py-3 text-right font-mono">{formatGNF(restant)}</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Reception / Delivery banner */}
        {invoice.statut === "valide" && (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-4 flex items-center gap-3">
            {type === "achat" ? <Truck className="h-5 w-5 text-green-600" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-400">
                {type === "achat" ? "Réception confirmée" : "Livraison confirmée"}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
                {type === "achat"
                  ? `Bon de réception émis le ${formatDateFr(dateValid)}`
                  : `Bon de livraison émis le ${formatDateFr(dateValid)}`}
              </p>
            </div>
          </div>
        )}

        {/* Print */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            {type === "achat"
              ? (invoice.statut === "valide" ? "Imprimer Bon de Réception" : "Imprimer Bon de Commande")
              : (invoice.statut === "valide" ? "Imprimer Bon de Livraison" : "Imprimer Proforma")}
          </Button>
        </div>
      </div>

      {/* Action Modal */}
      <ActionModal
        open={!!activeAction}
        action={activeAction}
        invoice={invoice}
        onClose={() => setActiveAction(null)}
        onSubmit={(values) => activeAction && actionMutation.mutate({ action: activeAction, values })}
        isPending={actionMutation.isPending}
      />
    </>
  );
}

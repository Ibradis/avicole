"use client";

import { CreditCard, PackageCheck } from "lucide-react";
import { ApiResourcePage, type ResourceConfig, type ResourceField } from "@/components/shared/api-resource-page";
import { BoutiqueDetail } from "@/components/shared/boutique-detail";
import { ChargeDetailView } from "@/components/shared/charge-detail-view";
import { InvoiceDetailView } from "@/components/shared/invoice-detail-view";
import { LotDetailView } from "@/components/shared/lot-detail-view";
import { PartnerDetailView } from "@/components/shared/partner-detail-view";
import { ProductDetailView } from "@/components/shared/product-detail-view";
import { WalletDetailView } from "@/components/shared/wallet-detail-view";
import { API_ROUTES } from "@/lib/api-routes";

// ---------------------------------------------------------------------------
// Shared option lists
// ---------------------------------------------------------------------------

const paymentOptions = [
  { label: "En attente", value: "en_attente" },
  { label: "Partiel", value: "partiel" },
  { label: "Payé", value: "paye" }
];

const getEntityOptions = (auth: any) => {
  if (auth.role === "pdg") return [{ label: "Ferme", value: "ferme" }];
  if (auth.role === "gerant" || auth.role === "vendeur") return [{ label: "Boutique", value: "boutique" }];
  return [
    { label: "Ferme", value: "ferme" },
    { label: "Boutique", value: "boutique" }
  ];
};

const commonEntityFields: ResourceField[] = [
  { name: "entite_type", label: "Entité", type: "select", options: getEntityOptions, defaultValue: "ferme" },
  { 
    name: "entite_id", 
    label: "Sélectionner l'entité", 
    remoteResource: (values) => values.entite_type === "boutique" ? API_ROUTES.boutiques : API_ROUTES.ferme.detail,
    remoteLabel: "nom",
    dependsOn: "entite_type",
    hidden: (values) => values.entite_type === "ferme"
  }
];

const farmOnlyEntityFields: ResourceField[] = [
  { name: "entite_type", label: "Entité", type: "select", options: getEntityOptions, defaultValue: "ferme", hidden: true },
  { name: "entite_id", label: "ID entité", hidden: true }
];

// ---------------------------------------------------------------------------
// Action builders
// ---------------------------------------------------------------------------

const validateAsActive = (endpoint: string) => (row: Record<string, any>) => ({
  url: `${endpoint.replace(/\/$/, "")}/${row.id}/`,
  method: "patch" as const,
  payload: { actif: true }
});

// ---------------------------------------------------------------------------
// All resource configs
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Invoice Workflow Actions (reused in list + detail view)
// ---------------------------------------------------------------------------

const venteActions = [
  {
    id: "valider",
    label: "Valider le bon de sortie",
    icon: PackageCheck,
    description: "Cette action va déduire les quantités de votre stock (Bon de sortie) et enregistrer la créance.",
    show: (row: any, auth: any) => 
      row.statut === "brouillon" && 
      (auth?.role === "admin" || auth?.role === "pdg" || (auth?.entite_type === row.entite_type && String(auth?.entite_id) === String(row.entite_id))),
    action: (row: any) => ({ url: `${API_ROUTES.ventes}${row.id}/valider/`, method: "post" as const }),
    successMessage: "Bon de sortie validé et stock déduit."
  },
  {
    id: "payer",
    label: "Enregistrer un paiement",
    icon: CreditCard,
    description: "Enregistrez un versement reçu pour cette vente.",
    show: (row: any, auth: any) => 
      row.statut === "valide" && 
      row.statut_paiement !== "paye" &&
      !row.boutique_dest && // On ne peut pas payer manuellement un transfert interne
      (auth?.role === "admin" || auth?.role === "pdg" || (auth?.entite_type === row.entite_type && String(auth?.entite_id) === String(row.entite_id))),
    fields: [
      { name: "montant", label: "Montant reçu", type: "number" as const, required: true },
      { name: "portefeuille_id", label: "Destination (Caisse/Banque)", remoteResource: API_ROUTES.finances.portefeuilles, remoteLabel: "nom", required: true }
    ],
    action: (row: any, values?: any) => ({ url: `${API_ROUTES.ventes}${row.id}/payer/`, method: "post" as const, payload: values }),
    successMessage: "Paiement client enregistré."
  }
];

const achatActions = [
  {
    id: "valider",
    label: "Réceptionner la marchandise",
    icon: PackageCheck,
    description: "Cette action va augmenter votre stock et enregistrer la dette fournisseur.",
    show: (row: any, auth: any) => 
      row.statut === "brouillon" && 
      (auth?.role === "admin" || auth?.role === "pdg" || (auth?.entite_type === row.entite_type && String(auth?.entite_id) === String(row.entite_id))),
    action: (row: any) => ({ url: `${API_ROUTES.achats}${row.id}/valider/`, method: "post" as const }),
    successMessage: "Stock mis à jour et achat validé."
  },
  {
    id: "payer",
    label: "Enregistrer un paiement",
    icon: CreditCard,
    description: "Enregistrez un versement (total ou partiel) pour cet achat.",
    show: (row: any, auth: any) => 
      row.statut === "valide" && 
      row.statut_paiement !== "paye" &&
      !row.vente_fournisseuse && // On ne peut pas payer manuellement un achat interne (ferme -> boutique)
      (auth?.role === "admin" || auth?.role === "pdg" || (auth?.entite_type === row.entite_type && String(auth?.entite_id) === String(row.entite_id))),
    fields: [
      { name: "montant", label: "Montant du versement", type: "number" as const, required: true },
      { name: "portefeuille_id", label: "Source (Caisse/Banque)", remoteResource: API_ROUTES.finances.portefeuilles, remoteLabel: "nom", required: true }
    ],
    action: (row: any, values?: any) => ({ url: `${API_ROUTES.achats}${row.id}/payer/`, method: "post" as const, payload: values }),
    successMessage: "Paiement enregistré avec succès."
  },
  {
    id: "initier_paiement_interne",
    label: "Initier paiement interne",
    icon: CreditCard,
    description: "Initiez une demande de virement vers la ferme pour cet achat interne. Le PDG devra valider la réception.",
    show: (row: any, auth: any) => 
      row.statut === "valide" && 
      row.statut_paiement !== "paye" &&
      !row.has_pending_paiement && // On ne peut pas renvoyer de demande si une est déjà en attente
      !!row.vente_fournisseuse && // C'est un virement interne
      (auth?.role === "admin" || auth?.role === "pdg" || (auth?.entite_type === "boutique" && String(auth?.entite_id) === String(row.entite_id))),
    fields: [
      { name: "montant", label: "Montant à transférer", type: "number" as const, required: true },
      { name: "source_portefeuille", label: "Votre Caisse/Banque (Source)", remoteResource: API_ROUTES.finances.portefeuilles, remoteLabel: "nom", required: true }
    ],
    action: (row: any, values?: any) => ({ 
      url: API_ROUTES.finances.demandesPaiement, 
      method: "post" as const, 
      payload: { ...values, achat: row.id, vente: row.vente_fournisseuse } 
    }),
    successMessage: "Demande de paiement envoyée au PDG."
  }
];

const demandePaiementActions = [
  {
    id: "valider",
    label: "Confirmer la réception",
    icon: PackageCheck,
    variant: "default" as const,
    description: "Choisissez le portefeuille de destination pour valider ce mouvement financier.",
    show: (row: any, auth: any) => row.statut === "en_attente" && (auth?.role === "admin" || auth?.role === "pdg" || (auth?.role === "gerant" && auth?.entite_type === "ferme")),
    fields: [
      { name: "dest_portefeuille", label: "Portefeuille de destination (Crédit)", remoteResource: API_ROUTES.finances.portefeuilles, remoteLabel: "nom", required: true }
    ],
    action: (row: any, values?: any) => ({ 
      url: `${API_ROUTES.finances.demandesPaiement}${row.id}/valider/`, 
      method: "post" as const, 
      payload: { ...values, decision: 'valide' } 
    }),
    successMessage: "Paiement réceptionné. Les soldes ont été mis à jour."
  },
  {
    id: "rejeter",
    label: "Rejeter la demande",
    icon: CreditCard,
    variant: "destructive" as const,
    description: "Refuser cette demande de paiement.",
    show: (row: any, auth: any) => row.statut === "en_attente" && (auth?.role === "admin" || auth?.role === "pdg"),
    action: (row: any) => ({ 
      url: `${API_ROUTES.finances.demandesPaiement}${row.id}/valider/`, 
      method: "post" as const, 
      payload: { decision: 'rejete' } 
    }),
    successMessage: "Demande de paiement rejetée."
  }
];

export const CONFIGS: Record<string, ResourceConfig> = {
  "Paiements Interne": {
    title: "Paiements Interne",
    description: "Validation des transferts de fonds entre boutiques et ferme.",
    endpoint: API_ROUTES.finances.demandesPaiement,
    exportBase: "tresorerie",
    columns: [
      { key: "date_demande", label: "Date", type: "date" },
      { key: "vente_ref", label: "Vente Réf" },
      { key: "source_nom", label: "Source" },
      { key: "montant", label: "Montant", type: "money" },
      { key: "statut", label: "Statut", type: "status" },
      { key: "initiateur_nom", label: "Initié par" }
    ],
    fields: [],
    customActions: demandePaiementActions,
    canCreate: false,
    canEdit: false,
    canDelete: (auth: any) => auth.role === "admin" || auth.role === "pdg",
  },
  // ---- Ferme ----------------------------------------------------------------
  Lots: {
    title: "Lots",
    description: "Lots de volailles: effectifs, race, origine et performances.",
    endpoint: API_ROUTES.ferme.lots,
    exportBase: "production",
    columns: [
      { key: "code", label: "Code" },
      { key: "date_arrivee", label: "Arrivée", type: "date" },
      { key: "quantite_initiale", label: "Quantité initiale", type: "number" },
      { key: "quantite_actuelle", label: "Quantité actuelle", type: "number" },
      { key: "souche", label: "Souche" },
      { key: "actif", label: "Actif", type: "boolean" }
    ],
    fields: [
      { name: "code", label: "Code du lot", required: true },
      { name: "date_arrivee", label: "Date d'arrivée", type: "date", required: true },
      { name: "quantite_initiale", label: "Quantité initiale", type: "number", required: true },
      { name: "quantite_actuelle", label: "Quantité actuelle", type: "number" },
      { name: "souche", label: "Souche" },
      { name: "origine", label: "Origine / Fournisseur" },
      { name: "actif", label: "Actif", type: "checkbox", defaultValue: true },
      ...farmOnlyEntityFields
    ],
    canCreate: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    canEdit: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    canDelete: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    detailView: (row, onBack) => (
      <LotDetailView
        endpoint={API_ROUTES.ferme.lots}
        id={row.id}
        onBack={onBack}
      />
    ),
  },

  Productions: {
    title: "Productions d'œufs",
    description: "Collecte quotidienne par lot: plateaux, unités et casse.",
    endpoint: API_ROUTES.ferme.productions,
    exportBase: "production",
    columns: [
      { key: "created_at", label: "Date", type: "date" },
      { key: "lot_code", label: "Lot" },
      { key: "quantite_plateaux", label: "Plateaux", type: "number" },
      { key: "quantite_unites", label: "Unités", type: "number" },
      { key: "oeufs_casses", label: "Cassés", type: "number" }
    ],
    fields: [
      { name: "lot", label: "Lot", remoteResource: API_ROUTES.ferme.lots, remoteLabel: "code", required: true },
      { name: "rapport", label: "Rapport journalier", remoteResource: API_ROUTES.ferme.rapports, remoteLabel: "display_label", required: true },
      { name: "quantite_plateaux", label: "Plateaux", type: "number" },
      { name: "quantite_unites", label: "Unités", type: "number", required: true },
      { name: "oeufs_casses", label: "Oeufs cassés", type: "number" },
      ...farmOnlyEntityFields
    ],
    validateLabel: undefined,
    validate: (row) => ({ url: `${API_ROUTES.ferme.productions}${row.id}/` })
  },

  "Rapports journaliers": {
    title: "Rapports journaliers",
    description: "Validation quotidienne: brouillon → soumis → validé.",
    endpoint: API_ROUTES.ferme.rapports,
    exportBase: "production",
    columns: [
      { key: "date_rapport", label: "Date", type: "date" },
      { key: "statut", label: "Statut", type: "status" },
      { key: "observations", label: "Observations" }
    ],
    fields: [
      { name: "date_rapport", label: "Date", type: "date", required: true },
      { name: "observations", label: "Observations", type: "textarea" },
      ...farmOnlyEntityFields
    ],
    validateLabel: "Valider le rapport",
    validate: (row) => ({
      url: `${API_ROUTES.ferme.rapports}${row.id}/valider/`,
      method: "post"
    })
  },

  // ---- Produits -------------------------------------------------------------
  Produits: {
    title: "Produits",
    description: "Catalogue: œufs, aliments, vaccins, matériel.",
    endpoint: API_ROUTES.produits,
    exportBase: "stock",
    columns: [
      { key: "nom", label: "Nom" },
      { key: "type", label: "Type" },
      { key: "prix_unitaire", label: "Prix unitaire", type: "money" },
      { key: "actif", label: "Actif", type: "boolean" }
    ],
    fields: [
      { name: "nom", label: "Nom", required: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        options: [
          { label: "Oeuf", value: "oeuf" },
          { label: "Aliment", value: "aliment" },
          { label: "Vaccin", value: "vaccin" },
          { label: "Matériel", value: "materiel" },
          { label: "Autre", value: "autre" }
        ],
        required: true
      },
      { name: "prix_unitaire", label: "Prix unitaire", type: "number" },
      { name: "description", label: "Description", type: "textarea" },
      ...commonEntityFields
    ],
    canCreate: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    canEdit: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    canDelete: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    validateLabel: "Réactiver",
    validate: validateAsActive(API_ROUTES.produits),
    detailView: (row, onBack) => (
      <ProductDetailView
        endpoint={API_ROUTES.produits}
        id={row.id}
        onBack={onBack}
      />
    ),
  },

  // ---- Boutiques ------------------------------------------------------------
  Boutiques: {
    title: "Boutiques",
    description: "Points de vente et de distribution.",
    endpoint: API_ROUTES.boutiques,
    exportBase: "stock",
    columns: [
      { key: "nom", label: "Nom" },
      { key: "adresse", label: "Adresse" },
      { key: "telephone", label: "Téléphone" },
      { key: "statut", label: "Statut" }
    ],
    fields: [
      { name: "nom", label: "Nom", required: true },
      { name: "telephone", label: "Téléphone" },
      { name: "adresse", label: "Adresse", type: "textarea" },
      { name: "responsable", label: "Responsable" },
      { name: "email", label: "Email", type: "email" }
    ],
    canCreate: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    canEdit: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    canDelete: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    detailView: (row, onBack) => <BoutiqueDetail boutique={row} onBack={onBack} />,
    validateLabel: "Activer",
    validate: validateAsActive(API_ROUTES.boutiques)
  },

  // ---- Ventes ---------------------------------------------------------------
  Ventes: {
    title: "Ventes",
    description: "Ventes ferme et boutiques, paiements et exports.",
    endpoint: API_ROUTES.ventes,
    exportBase: "ventes",
    columns: [
      { key: "date_vente", label: "Date", type: "date" },
      { key: "reference", label: "Référence" },
      { key: "destinataire_nom", label: "Destinataire" },
      { key: "montant_total", label: "Montant", type: "money" },
      { key: "statut", label: "Statut", type: "status" },
      { key: "statut_paiement", label: "Paiement", type: "status" }
    ],
    fields: [
      { name: "date_vente", label: "Date de vente", type: "date", required: true, defaultValue: new Date().toISOString().split("T")[0] },
      { name: "client", label: "Client", remoteResource: API_ROUTES.partenaires, remoteLabel: "nom" },
      { name: "boutique_dest", label: "Ou Boutique destinataire", remoteResource: API_ROUTES.boutiques, remoteLabel: "nom" },
      { name: "reference", label: "Référence", placeholder: "Ex: BL-2024-001" },
      { name: "observations", label: "Observations", type: "textarea" },
      {
        name: "lignes_data",
        label: "Produits vendus",
        type: "lines",
        linesFields: [
          { name: "produit_id", label: "Produit", remoteResource: API_ROUTES.produits, remoteLabel: "nom", required: true },
          { name: "quantite", label: "Quantité", type: "number", required: true },
          { name: "prix_unitaire", label: "Prix Unitaire", type: "number", required: true }
        ]
      },
      ...commonEntityFields
    ],
    canEdit: (auth: any, row: any) => (auth.role === "admin" || auth.role === "pdg" || auth.role === "gerant" || auth.role === "vendeur") && (!row || row.statut === "brouillon"),
    canDelete: (auth: any, row: any) => (auth.role === "admin" || auth.role === "pdg") && (!row || row.statut === "brouillon"),
    customActions: venteActions,
    printTitle: (row) => `Facture Vente ${row.reference ?? row.id}`,
    detailView: (row, onBack) => (
      <InvoiceDetailView
        endpoint={API_ROUTES.ventes}
        id={row.id}
        type="vente"
        onBack={onBack}
        actions={venteActions}
      />
    ),
  },

  // ---- Achats ---------------------------------------------------------------
  Achats: {
    title: "Achats",
    description: "Gestion des approvisionnements et factures fournisseurs",
    endpoint: API_ROUTES.achats,
    exportBase: "achats",
    columns: [
      { key: "date_achat", label: "Date", type: "date" },
      { key: "reference", label: "Référence" },
      { key: "fournisseur_nom", label: "Fournisseur" },
      { key: "montant_total", label: "Montant", type: "money" },
      { key: "statut", label: "Statut", type: "status" },
      { key: "statut_paiement", label: "Paiement", type: "status" },
    ],
    fields: [
      { name: "date_achat", label: "Date de facturation", type: "date", required: true, defaultValue: new Date().toISOString().split("T")[0] },
      { name: "fournisseur", label: "Fournisseur", remoteResource: API_ROUTES.partenaires, remoteLabel: "nom", required: true },
      { name: "reference", label: "Numéro de Facture", placeholder: "Ex: FAC-2024-001" },
      { name: "observations", label: "Observations", type: "textarea" },
      {
        name: "lignes_data",
        label: "Produits achetés",
        type: "lines",
        linesFields: [
          { name: "produit_id", label: "Produit", remoteResource: API_ROUTES.produits, remoteLabel: "nom", required: true },
          { name: "quantite", label: "Quantité", type: "number", required: true },
          { name: "prix_unitaire", label: "P.U", type: "number", required: true }
        ]
      },
      ...commonEntityFields
    ],
    canEdit: (auth: any, row: any) => (auth.role === "admin" || auth.role === "pdg" || auth.role === "gerant") && (!row || row.statut === "brouillon"),
    canDelete: (auth: any, row: any) => (auth.role === "admin" || auth.role === "pdg") && (!row || row.statut === "brouillon"),
    customActions: achatActions,
    printTitle: (row) => `Achat ${row.reference ?? row.id}`,
    detailView: (row, onBack) => (
      <InvoiceDetailView
        endpoint={API_ROUTES.achats}
        id={row.id}
        type="achat"
        onBack={onBack}
        actions={achatActions}
      />
    ),
  },

  // ---- Stock ----------------------------------------------------------------
  Stock: {
    title: "Stock",
    description: "Niveaux de stock par produit et alertes seuil.",
    endpoint: API_ROUTES.stock.list,
    exportBase: "stock",
    columns: [
      { key: "produit_nom", label: "Produit" },
      { key: "quantite_actuelle", label: "Quantité", type: "number" },
      { key: "seuil_alerte", label: "Seuil alerte", type: "number" },
      { key: "entite_type", label: "Entité" }
    ],
    fields: [
      { name: "produit", label: "Produit", remoteResource: API_ROUTES.produits, remoteLabel: "nom", required: true },
      { name: "quantite_actuelle", label: "Quantité actuelle", type: "number", required: true },
      { name: "seuil_alerte", label: "Seuil d'alerte", type: "number", required: true },
      ...commonEntityFields
    ],
    canCreate: false,
    canDelete: false,
    validateLabel: "Mettre à jour seuil",
    validate: (row) => ({
      url: `${API_ROUTES.stock.list}${row.id}/`,
      method: "patch",
      payload: { seuil_alerte: row.seuil_alerte }
    })
  },
  StockMateriel: {
    title: "Stock Matériel",
    description: "État du stock pour le matériel et équipement.",
    endpoint: `${API_ROUTES.stock.list}?type=materiel`,
    exportBase: "stock",
    columns: [
      { key: "produit_nom", label: "Matériel" },
      { key: "quantite_actuelle", label: "Quantité", type: "number" },
      { key: "seuil_alerte", label: "Seuil alerte", type: "number" },
      { key: "entite_type", label: "Entité" }
    ],
    fields: [
      { name: "produit", label: "Matériel", remoteResource: `${API_ROUTES.produits}?type=materiel`, remoteLabel: "nom", required: true },
      { name: "quantite_actuelle", label: "Quantité actuelle", type: "number", required: true },
      { name: "seuil_alerte", label: "Seuil d'alerte", type: "number", required: true },
      ...commonEntityFields
    ],
    canCreate: false,
    canDelete: false,
    validateLabel: "Mettre à jour seuil",
    validate: (row) => ({
      url: `${API_ROUTES.stock.list}${row.id}/`,
      method: "patch",
      payload: { seuil_alerte: row.seuil_alerte }
    })
  },

  "Mouvements de stock": {
    title: "Mouvements de stock",
    description: "Entrées et sorties par produit avec motif.",
    endpoint: API_ROUTES.stock.mouvements,
    exportBase: "stock",
    columns: [
      { key: "date_mouvement", label: "Date", type: "date" },
      { key: "produit_nom", label: "Produit" },
      { key: "type_mouvement", label: "Type" },
      { key: "quantite", label: "Quantité", type: "number" }
    ],
    fields: [
      { name: "date_mouvement", label: "Date", type: "date", required: true },
      { name: "produit", label: "Produit", remoteResource: API_ROUTES.produits, remoteLabel: "nom", required: true },
      {
        name: "type_mouvement",
        label: "Type",
        type: "select",
        options: [
          { label: "Entrée", value: "entree" },
          { label: "Sortie", value: "sortie" }
        ],
        required: true
      },
      { name: "quantite", label: "Quantité", type: "number", required: true },
      { name: "reference", label: "Référence" },
      { name: "observations", label: "Observations", type: "textarea" },
      ...commonEntityFields
    ],
    canEdit: false,
    canDelete: false,
    validateLabel: undefined,
    validate: (row) => ({ url: `${API_ROUTES.stock.mouvements}${row.id}/` })
  },

  // ---- Partenaires ----------------------------------------------------------
  Partenaires: {
    title: "Partenaires",
    description: "Fournisseurs, clients et suivi des soldes.",
    endpoint: API_ROUTES.partenaires,
    exportBase: "partenaires",
    columns: [
      { key: "nom", label: "Nom" },
      { key: "type", label: "Type" },
      { key: "telephone", label: "Téléphone" },
      { key: "solde_actuel", label: "Solde", type: "money" },
      { key: "actif", label: "Actif", type: "boolean" }
    ],
    fields: [
      { name: "nom", label: "Nom", required: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        options: [
          { label: "Client", value: "client" },
          { label: "Fournisseur", value: "fournisseur" }
        ],
        required: true
      },
      { name: "telephone", label: "Téléphone" },
      { name: "email", label: "Email", type: "email" },
      { name: "solde_initial", label: "Solde initial", type: "number" },
      { name: "adresse", label: "Adresse", type: "textarea" },
      ...commonEntityFields
    ],
    validateLabel: "Réactiver",
    validate: validateAsActive(API_ROUTES.partenaires),
    detailView: (row, onBack) => (
      <PartnerDetailView
        endpoint={API_ROUTES.partenaires}
        id={row.id}
        onBack={onBack}
      />
    ),
  },

  // ---- Finances -------------------------------------------------------------
  Portefeuilles: {
    title: "Portefeuilles",
    description: "Caisses et comptes bancaires de l'organisation.",
    endpoint: API_ROUTES.finances.portefeuilles,
    exportBase: "tresorerie",
    columns: [
      { key: "nom", label: "Nom" },
      { key: "type", label: "Type" },
      { key: "solde_init", label: "Solde initial", type: "money" },
      { key: "solde_actuel", label: "Solde actuel", type: "money" }
    ],
    fields: [
      { name: "nom", label: "Nom", required: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        options: [
          { label: "Caisse", value: "caisse" },
          { label: "Banque", value: "banque" }
        ],
        required: true
      },
      { name: "solde_init", label: "Solde initial", type: "number" },
      ...commonEntityFields
    ],
    canCreate: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    canEdit: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    canDelete: (auth: any) => auth.role === "admin" || auth.role === "pdg",
    detailView: (row, onBack) => (
      <WalletDetailView
        endpoint={API_ROUTES.finances.portefeuilles}
        id={row.id}
        onBack={onBack}
      />
    ),
  },

  Finances: {
    title: "Mouvements de trésorerie",
    description: "Encaissements, décaissements et transferts internes.",
    endpoint: API_ROUTES.finances.mouvements,
    exportBase: "tresorerie",
    columns: [
      { key: "date_mouvement", label: "Date", type: "date" },
      { key: "nature", label: "Nature" },
      { key: "montant", label: "Montant", type: "money" },
      { key: "description", label: "Description" }
    ],
    fields: [
      { name: "date_mouvement", label: "Date", type: "date", required: true },
      {
        name: "nature",
        label: "Nature",
        type: "select",
        options: [
          { label: "Vente", value: "vente" },
          { label: "Achat", value: "achat" },
          { label: "Charge", value: "charge" },
          { label: "Vétérinaire", value: "veterinaire" },
          { label: "Transfert", value: "transfert_portefeuille" }
        ],
        required: true
      },
      { name: "montant", label: "Montant", type: "number", required: true },
      {
        name: "source_type",
        label: "Source",
        type: "select",
        options: [
          { label: "Portefeuille", value: "portefeuille" },
          { label: "Tiers", value: "tiers" }
        ],
        defaultValue: "portefeuille"
      },
      {
        name: "dest_type",
        label: "Destination",
        type: "select",
        options: [
          { label: "Portefeuille", value: "portefeuille" },
          { label: "Tiers", value: "tiers" }
        ],
        defaultValue: "tiers"
      },
      { name: "description", label: "Description", type: "textarea" }
    ],
    validateLabel: undefined,
    validate: (row) => ({
      url: `${API_ROUTES.finances.mouvements}${row.id}/`,
      method: "patch",
      payload: { description: row.description ?? "" }
    })
  },

  // ---- Charges --------------------------------------------------------------
  Charges: {
    title: "Types de Charges",
    description: "Catégories de dépenses (eau, électricité, transport…).",
    endpoint: API_ROUTES.charges.types,
    exportBase: "charges",
    resourceName: "Type de Charge",
    columns: [
      { key: "nom", label: "Nom" },
      { key: "description", label: "Description" },
      { key: "actif", label: "Actif", type: "boolean" }
    ],
    fields: [
      { name: "nom", label: "Nom", required: true },
      { name: "description", label: "Description", type: "textarea" },
      ...commonEntityFields
    ],
    detailView: (row, onBack) => (
      <ChargeDetailView endpoint={API_ROUTES.charges.types} id={row.id} onBack={onBack} />
    ),
    validateLabel: "Réactiver",
    validate: validateAsActive(API_ROUTES.charges.types)
  },

  // ---- Santé animale --------------------------------------------------------
  Vaccinations: {
    title: "Vaccinations",
    description: "Vaccins administrés par lot et méthode.",
    endpoint: API_ROUTES.sante.vaccinations,
    exportBase: "veterinaires",
    columns: [
      { key: "date_vaccination", label: "Date", type: "date" },
      { key: "lot_code", label: "Lot" },
      { key: "produit_nom", label: "Vaccin" },
      { key: "methode_administration", label: "Méthode" }
    ],
    fields: [
      { name: "date_vaccination", label: "Date", type: "date", required: true },
      { name: "lot", label: "Lot", remoteResource: API_ROUTES.ferme.lots, remoteLabel: "code", required: true },
      { name: "produit", label: "Vaccin", remoteResource: API_ROUTES.produits, remoteLabel: "nom", required: true },
      { name: "methode_administration", label: "Méthode d'administration" },
      { name: "intervenant", label: "Intervenant", remoteResource: "utilisateurs/", remoteLabel: "email" },
      { name: "observations", label: "Observations", type: "textarea" },
      ...farmOnlyEntityFields
    ],
    validateLabel: undefined,
    validate: (row) => ({
      url: `${API_ROUTES.sante.vaccinations}${row.id}/`,
      method: "patch",
      payload: { observations: row.observations ?? "" }
    })
  },

  Traitements: {
    title: "Traitements",
    description: "Traitements médicamenteux par lot, posologie et durée.",
    endpoint: API_ROUTES.sante.traitements,
    exportBase: "veterinaires",
    columns: [
      { key: "date_debut", label: "Début", type: "date" },
      { key: "date_fin", label: "Fin", type: "date" },
      { key: "lot_code", label: "Lot" },
      { key: "produit_nom", label: "Médicament" },
      { key: "posologie", label: "Posologie" }
    ],
    fields: [
      { name: "date_debut", label: "Date début", type: "date", required: true },
      { name: "date_fin", label: "Date fin", type: "date" },
      { name: "lot", label: "Lot", remoteResource: API_ROUTES.ferme.lots, remoteLabel: "code", required: true },
      { name: "produit", label: "Médicament", remoteResource: API_ROUTES.produits, remoteLabel: "nom", required: true },
      { name: "posologie", label: "Posologie" },
      { name: "observations", label: "Observations", type: "textarea" },
      ...farmOnlyEntityFields
    ],
    validateLabel: undefined,
    validate: (row) => ({ url: `${API_ROUTES.sante.traitements}${row.id}/` })
  },

  "Mortalités": {
    title: "Mortalités",
    description: "Enregistrement des pertes par lot, date et cause.",
    endpoint: API_ROUTES.sante.mortalites,
    exportBase: "veterinaires",
    columns: [
      { key: "date", label: "Date", type: "date" },
      { key: "lot_code", label: "Lot" },
      { key: "quantite", label: "Quantité", type: "number" },
      { key: "cause", label: "Cause" }
    ],
    fields: [
      { name: "date", label: "Date", type: "date", required: true },
      { name: "lot", label: "Lot", remoteResource: API_ROUTES.ferme.lots, remoteLabel: "code", required: true },
      { name: "quantite", label: "Quantité", type: "number", required: true },
      { name: "cause", label: "Cause" },
      { name: "observations", label: "Observations", type: "textarea" },
      ...farmOnlyEntityFields
    ],
    validateLabel: undefined,
    validate: (row) => ({ url: `${API_ROUTES.sante.mortalites}${row.id}/` })
  },

  // ---- Alimentation ---------------------------------------------------------
  Alimentation: {
    title: "Alimentation",
    description: "Consommation aliments par lot, coût et coût par œuf.",
    endpoint: API_ROUTES.alimentation.consommations,
    exportBase: "production",
    columns: [
      { key: "date_consommation", label: "Date", type: "date" },
      { key: "lot_code", label: "Lot" },
      { key: "produit_nom", label: "Aliment" },
      { key: "quantite", label: "Quantité (kg)", type: "number" }
    ],
    fields: [
      { name: "date_consommation", label: "Date", type: "date", required: true },
      { name: "lot", label: "Lot", remoteResource: API_ROUTES.ferme.lots, remoteLabel: "code", required: true },
      { name: "produit", label: "Aliment", remoteResource: API_ROUTES.produits, remoteLabel: "nom", required: true },
      { name: "quantite", label: "Quantité (kg)", type: "number", required: true },
      { name: "observations", label: "Observations", type: "textarea" },
      ...farmOnlyEntityFields
    ],
    validateLabel: undefined,
    validate: (row) => ({
      url: `${API_ROUTES.alimentation.consommations}${row.id}/`,
      method: "patch",
      payload: { quantite: row.quantite }
    })
  },

  // ---- Vétérinaires ---------------------------------------------------------
  Vétérinaires: {
    title: "Vétérinaires",
    description: "Contacts vétérinaires et spécialités.",
    endpoint: API_ROUTES.veterinaires.list,
    exportBase: "veterinaires",
    columns: [
      { key: "nom", label: "Nom" },
      { key: "telephone", label: "Téléphone" },
      { key: "email", label: "Email" },
      { key: "specialite", label: "Spécialité" },
      { key: "actif", label: "Actif", type: "boolean" }
    ],
    fields: [
      { name: "nom", label: "Nom complet", required: true },
      { name: "telephone", label: "Téléphone" },
      { name: "email", label: "Email", type: "email" },
      { name: "specialite", label: "Spécialité" },
      ...farmOnlyEntityFields
    ],
    validateLabel: "Réactiver",
    validate: validateAsActive(API_ROUTES.veterinaires.list)
  },

  Contrats: {
    title: "Contrats vétérinaires",
    description: "Contrats de suivi sanitaire: durée, montant et termes.",
    endpoint: API_ROUTES.veterinaires.contrats,
    exportBase: "veterinaires",
    columns: [
      { key: "veterinaire_nom", label: "Vétérinaire" },
      { key: "date_debut", label: "Début", type: "date" },
      { key: "date_fin", label: "Fin", type: "date" },
      { key: "montant", label: "Montant", type: "money" }
    ],
    fields: [
      { name: "veterinaire", label: "Vétérinaire", remoteResource: API_ROUTES.veterinaires.list, remoteLabel: "nom", required: true },
      { name: "date_debut", label: "Date début", type: "date", required: true },
      { name: "date_fin", label: "Date fin", type: "date" },
      { name: "montant", label: "Montant", type: "number" },
      { name: "observations", label: "Observations / termes", type: "textarea" },
      ...farmOnlyEntityFields
    ],
    validateLabel: undefined,
    validate: (row) => ({ url: `${API_ROUTES.veterinaires.contrats}${row.id}/` }),
    printTitle: (row) => `Contrat vétérinaire — ${row.veterinaire_nom ?? row.id}`
  },

  Interventions: {
    title: "Interventions vétérinaires",
    description: "Visites, actes et coûts des interventions sur site.",
    endpoint: API_ROUTES.veterinaires.interventions,
    exportBase: "veterinaires",
    columns: [
      { key: "date_intervention", label: "Date", type: "date" },
      { key: "veterinaire_nom", label: "Vétérinaire" },
      { key: "motif", label: "Motif" },
      { key: "montant", label: "Coût", type: "money" }
    ],
    fields: [
      { name: "date_intervention", label: "Date", type: "date", required: true },
      { name: "veterinaire", label: "Vétérinaire", remoteResource: API_ROUTES.veterinaires.list, remoteLabel: "nom", required: true },
      { name: "lot", label: "Lot", remoteResource: API_ROUTES.ferme.lots, remoteLabel: "code" },
      { name: "motif", label: "Motif", required: true },
      { name: "montant", label: "Coût", type: "number" },
      { name: "observations", label: "Observations", type: "textarea" },
      ...farmOnlyEntityFields
    ],
    validateLabel: undefined,
    validate: (row) => ({ url: `${API_ROUTES.veterinaires.interventions}${row.id}/` })
  },

  // ---- COFO -----------------------------------------------------------------
  COFO: {
    title: "COFO",
    description: "Suivi investissement aliment, encaissement et bénéfice net.",
    endpoint: API_ROUTES.cofo,
    exportBase: "cofo",
    columns: [
      { key: "date_operation", label: "Date", type: "date" },
      { key: "type_operation", label: "Type" },
      { key: "montant", label: "Montant", type: "money" },
      { key: "quantite_sacs", label: "Sacs", type: "number" }
    ],
    fields: [
      { name: "date_operation", label: "Date", type: "date", required: true },
      {
        name: "type_operation",
        label: "Type",
        type: "select",
        options: [
          { label: "Achat", value: "achat" },
          { label: "Vente", value: "vente" }
        ],
        required: true
      },
      { name: "montant", label: "Montant", type: "number", required: true },
      { name: "quantite_sacs", label: "Quantité sacs", type: "number" },
      { name: "fournisseur", label: "Fournisseur" },
      { name: "client", label: "Client" },
      { name: "notes", label: "Notes", type: "textarea" },
      ...farmOnlyEntityFields
    ],
    validateLabel: undefined,
    validate: (row) => ({
      url: `${API_ROUTES.cofo}${row.id}/`,
      method: "patch",
      payload: { notes: row.notes ?? "" }
    })
  },

  // ---- Administration --------------------------------------------------------
  Utilisateurs: {
    title: "Équipe",
    description: "Gestion des utilisateurs, invitations et rôles.",
    endpoint: "utilisateurs/",
    exportBase: "utilisateurs",
    columns: [
      { key: "email", label: "Email" },
      { key: "role", label: "Rôle" },
      { key: "telephone", label: "Téléphone" },
      { key: "is_active", label: "Actif", type: "boolean" }
    ],
    fields: [
      { name: "email", label: "Email", type: "email", required: true },
      {
        name: "role",
        label: "Rôle",
        type: "select",
        options: (auth: any) =>
          auth.role === "gerant"
            ? [{ label: "Vendeur", value: "vendeur" }]
            : [
                { label: "Administrateur", value: "admin" },
                { label: "PDG", value: "pdg" },
                { label: "Contrôleur", value: "controleur" },
                { label: "Gérant", value: "gerant" },
                { label: "Vendeur", value: "vendeur" }
              ],
        required: true
      },
      { name: "telephone", label: "Téléphone" },
      { name: "is_active", label: "Actif", type: "checkbox", defaultValue: true }
    ],
    validateLabel: "Inviter",
    validate: (row) => ({
      url: API_ROUTES.auth.invite,
      method: "post",
      payload: { email: row.email, role: row.role }
    })
  },

  Organisation: {
    title: "Organisation",
    description: "Paramètres de votre structure, plan et facturation.",
    endpoint: "organisations/details/", // I'll assume this endpoint exists or create a placeholder
    exportBase: "organisation",
    columns: [
      { key: "nom", label: "Nom" },
      { key: "pays", label: "Pays" },
      { key: "devise", label: "Devise" },
      { key: "plan", label: "Plan" }
    ],
    fields: [
      { name: "nom", label: "Nom", required: true },
      { name: "email_contact", label: "Email de contact", type: "email", required: true },
      { name: "telephone", label: "Téléphone" },
      { name: "adresse", label: "Adresse", type: "textarea" },
      {
        name: "plan",
        label: "Plan",
        type: "select",
        options: [
          { label: "Gratuit", value: "gratuit" },
          { label: "Standard", value: "standard" },
          { label: "Premium", value: "premium" }
        ]
      }
    ],
    canCreate: false,
    canDelete: false,
    validateLabel: undefined,
    validate: (row) => ({
      url: "organisations/details/",
      method: "patch"
    })
  }
};

// ---------------------------------------------------------------------------
// Legacy ModulePlaceholder component (kept for pages that still use it)
// ---------------------------------------------------------------------------

export function ModulePlaceholder({
  title,
  description,
  exportBase
}: {
  title: string;
  description: string;
  exportBase: string;
}) {
  const config = CONFIGS[title] ?? {
    title,
    description,
    endpoint: API_ROUTES.reporting.tresorerie,
    exportBase,
    columns: [{ key: "titre", label: "Rapport" }],
    fields: [],
    validateLabel: undefined,
    validate: () => ({ url: API_ROUTES.reporting.tresorerie })
  };

  return <ApiResourcePage config={config} />;
}

import type { Role } from "./roles";

export type Tokens = {
  access: string;
  refresh: string;
};

export type ApiList<T> = {
  results?: T[];
  count?: number;
};

export type User = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: Role;
  organisation?: number | null;
  entite_type?: "ferme" | "boutique" | null;
  entite_id?: number | null;
  is_active?: boolean;
  doit_changer_mdp?: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  organisation_nom: string;
  pays: string;
  devise: "GNF";
  admin_nom: string;
  email: string;
  password: string;
  telephone?: string;
};

export type DashboardKpis = {
  total_ventes?: number;
  total_achats?: number;
  liquidite_totale?: number;
  dettes_clients_ferme?: number;
  dettes_fournisseurs_ferme?: number;
  production_jour?: number;
  achats_impayes?: number;
  stock_critique?: number;
};

export type DashboardResponse = {
  dashboard?: string;
  kpis?: DashboardKpis;
  alertes_rupture_stock?: StockItem[];
  mouvements_financiers_recents?: MouvementCaisse[];
};

export type StockItem = {
  id: number;
  produit_libelle?: string;
  produit?: number;
  quantite_actuelle?: number;
  seuil_alerte?: number;
  entite_type?: "ferme" | "boutique";
};

export type MouvementCaisse = {
  id: number;
  montant: number | string;
  nature: "vente" | "achat" | "achat_cofo" | "vente_cofo" | "veterinaire" | "charge" | "transfert_portefeuille";
  description?: string | null;
  date_mouvement: string;
};

export type ChartPoint = {
  name: string;
  recettes?: number;
  charges?: number;
  production?: number;
  tresorerie?: number;
  investissement?: number;
  encaissement?: number;
  stock?: number;
};

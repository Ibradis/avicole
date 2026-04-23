export const ROLES = ["admin", "pdg", "controleur", "gerant", "vendeur"] as const;

export type Role = (typeof ROLES)[number];

export type Permission =
  | "*"
  | "dashboard.admin"
  | "ferme.read"
  | "ferme.write"
  | "alimentation.read"
  | "alimentation.write"
  | "sante.read"
  | "sante.write"
  | "boutique.read"
  | "boutique.write"
  | "ventes.read"
  | "ventes.write"
  | "achats.read"
  | "achats.write"
  | "cofo.read"
  | "cofo.write"
  | "finance.ferme"
  | "finance.boutique"
  | "charges.read"
  | "charges.write"
  | "partenaires.read"
  | "partenaires.write"
  | "reporting.ferme"
  | "reporting.boutique"
  | "administration.users";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  pdg: "PDG",
  controleur: "Contrôleur",
  gerant: "Gérant",
  vendeur: "Vendeur"
};

export const PERMISSIONS: Record<Role, Permission[]> = {
  admin: ["*"],
  pdg: [
    "ferme.read",
    "ferme.write",
    "alimentation.read",
    "alimentation.write",
    "sante.read",
    "sante.write",
    "ventes.read",
    "achats.read",
    "cofo.read",
    "cofo.write",
    "finance.ferme",
    "charges.read",
    "partenaires.read",
    "reporting.ferme"
  ],
  controleur: [
    "ferme.read",
    "ferme.write",
    "alimentation.read",
    "alimentation.write",
    "sante.read"
  ],
  gerant: [
    "boutique.read",
    "boutique.write",
    "ventes.read",
    "ventes.write",
    "achats.read",
    "achats.write",
    "finance.boutique",
    "charges.read",
    "charges.write",
    "partenaires.read",
    "partenaires.write",
    "reporting.boutique",
    "administration.users"
  ],
  vendeur: ["ferme.read", "boutique.read", "ventes.read", "ventes.write"]
};

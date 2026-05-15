export const API_ROUTES = {
  auth: {
    login: "auth/connexion/",
    refresh: "auth/rafraichir/",
    logout: "auth/deconnexion/",
    invite: "auth/inviter/",
    activate: "auth/activer/",
    resetPassword: "auth/mot-de-passe/reinitialiser/",
    confirmRegistration: "auth/confirmer-inscription/",
    resendCode: "auth/renvoyer-code/"
  },
  organisations: {
    inscription: "organisations/inscription/"
  },
  produits: "produits/",
  partenaires: "partenaires/",
  boutiques: "boutiques/",
  ferme: {
    detail: "ferme/",
    lots: "ferme/lots/",
    productions: "ferme/productions/",
    rapports: "ferme/rapports/"
  },
  alimentation: {
    consommations: "alimentation/consommations/"
  },
  sante: {
    vaccinations: "sante/vaccinations/",
    traitements: "sante/traitements/",
    mortalites: "sante/mortalites/"
  },
  veterinaires: {
    list: "veterinaires/",
    contrats: "veterinaires/contrats/",
    interventions: "veterinaires/interventions/"
  },
  finances: {
    portefeuilles: "finances/portefeuilles/",
    mouvements: "finances/mouvements/",
    transfert: "finances/transfert/",
    tresorerieConsolidee: "finances/tresorerie/consolidee/",
    demandesPaiement: "finances/demandes-paiement/"
  },
  charges: {
    types: "charges/types/"
  },
  cofo: "cofo/",
  achats: "achats/",
  ventes: "sales/ventes/",
  stock: {
    list: "stock/",
    alertes: "stock/alertes/",
    mouvements: "stock/mouvements/"
  },
  reporting: {
    tresorerie: "reporting/tresorerie/",
    production: "reporting/production/",
    coutRevient: "reporting/cout-revient/",
    ventes: "reporting/ventes/",
    achats: "reporting/achats/",
    charges: "reporting/charges/",
    cofo: "reporting/cofo/",
    veterinaires: "reporting/veterinaires/",
    stock: "reporting/stock/",
    partenairesSoldes: "reporting/partenaires/soldes/",
    dashboardFerme: "reporting/dashboard/ferme/",
    dashboardBoutique: (id: number) => `reporting/dashboard/boutique/${id}/`
  },
  exports: {
    ventePdf: (id: number) => `exports/ventes/${id}/pdf/`,
    venteExcel: (id: number) => `exports/ventes/${id}/excel/`,
    achatPdf: (id: number) => `exports/achats/${id}/pdf/`,
    achatExcel: (id: number) => `exports/achats/${id}/excel/`,
    reportingPdf: (name: string) => `exports/reporting/${name}/pdf/`,
    reportingExcel: (name: string) => `exports/reporting/${name}/excel/`
  }
} as const;

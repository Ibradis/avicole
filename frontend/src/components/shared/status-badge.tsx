import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  
  if (s === "paye" || s === "valide" || s === "actif" || s === "active") 
    return <Badge variant="success">{status === "paye" ? "Payé" : status === "valide" ? "Validé" : "Actif"}</Badge>;
    
  if (s === "partiel" || s === "en_attente" || s === "soumis") 
    return <Badge variant="warning">{status === "partiel" ? "Partiel" : status === "en_attente" ? "En attente" : "Soumis"}</Badge>;
    
  if (s === "non_paye" || s === "rejete" || s === "annule" || s === "inactif" || s === "inactive" || s === "brouillon") 
    return <Badge variant="destructive">{status === "non_paye" ? "Non payé" : status === "rejete" ? "Rejeté" : status === "annule" ? "Annulé" : status === "brouillon" ? "Brouillon" : "Inactif"}</Badge>;

  return <Badge variant="outline">{status}</Badge>;
}

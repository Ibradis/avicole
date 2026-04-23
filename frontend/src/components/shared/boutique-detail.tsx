"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, ShoppingBag, Box, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { DataTable } from "@/components/shared/data-table";
import { ResourceForm, type ResourceField } from "@/components/shared/api-resource-page";
import { apiClient } from "@/lib/axios";
import { unwrapResults, formatGNF, formatDateFr } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type BoutiqueDetailProps = {
  boutique: any;
  onBack: () => void;
};

export function BoutiqueDetail({ boutique }: BoutiqueDetailProps) {
  const queryClient = useQueryClient();
  const [isAddingSeller, setIsAddingSeller] = useState(false);
  const [affiliationMode, setAffiliationMode] = useState<"new" | "existing">("new");
  const [selecteduserId, setSelectedUserId] = useState<string>("");
  const [existingUserRole, setExistingUserRole] = useState<string>("vendeur");

  // Fetch Sellers
  const sellersQuery = useQuery({
    queryKey: ["vendeurs", boutique.id],
    queryFn: async () => {
      const response = await apiClient.get(`/utilisateurs/?entite_type=boutique&entite_id=${boutique.id}`);
      return unwrapResults(response.data);
    }
  });

  const saveSellerMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (affiliationMode === "new") {
        const fullPayload = {
          ...payload,
          entite_type: "boutique",
          entite_id: boutique.id
        };
        return apiClient.post("/utilisateurs/", fullPayload);
      } else {
        return apiClient.patch(`/utilisateurs/${selecteduserId}/`, {
          entite_type: "boutique",
          entite_id: boutique.id,
          role: existingUserRole
        });
      }
    },
    onSuccess: () => {
      toast.success(affiliationMode === "new" ? "Vendeur créé et affilié" : "Vendeur affilié avec succès");
      setIsAddingSeller(false);
      setSelectedUserId("");
      queryClient.invalidateQueries({ queryKey: ["vendeurs", boutique.id] });
      if (affiliationMode === "existing") {
        queryClient.invalidateQueries({ queryKey: ["all-users"] });
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Erreur lors de l'affiliation";
      toast.error(msg);
    }
  });

  const allUsersQuery = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const response = await apiClient.get("/utilisateurs/");
      return unwrapResults(response.data);
    },
    enabled: affiliationMode === "existing"
  });

  const sellerFields: ResourceField[] = [
    { name: "email", label: "Email", type: "email", required: true },
    { name: "first_name", label: "Prénom", required: true },
    { name: "last_name", label: "Nom", required: true },
    {
      name: "role",
      label: "Rôle",
      type: "select",
      options: [
        { label: "Gérant", value: "gerant" },
        { label: "Vendeur", value: "vendeur" }
      ],
      defaultValue: "vendeur",
      required: true
    },
    { name: "telephone", label: "Téléphone" },
  ];

  // Fetch Sales
  const salesQuery = useQuery({
    queryKey: ["ventes", boutique.id],
    queryFn: async () => {
      const response = await apiClient.get(`/ventes/?entite_type=boutique&entite_id=${boutique.id}`);
      return unwrapResults(response.data);
    }
  });

  // Fetch Stocks
  const stocksQuery = useQuery({
    queryKey: ["stocks", boutique.id],
    queryFn: async () => {
      const response = await apiClient.get(`/stocks/?entite_type=boutique&entite_id=${boutique.id}`);
      return unwrapResults(response.data);
    }
  });

  return (
    <div className="p-4 space-y-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">{boutique.nom}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            {boutique.adresse || "Aucune adresse"} • {boutique.telephone || "Pas de téléphone"}
          </p>
        </div>
        
        {boutique.solde_caisse !== undefined && (
          <div className="rounded-xl border bg-card p-4 shadow-sm min-w-[200px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Solde de la caisse</p>
            <p className="text-2xl font-bold text-primary">{formatGNF(boutique.solde_caisse)}</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="vendeurs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendeurs" className="gap-2">
            <Users className="h-4 w-4" />
            Vendeurs
          </TabsTrigger>
          <TabsTrigger value="ventes" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Activités (Ventes)
          </TabsTrigger>
          <TabsTrigger value="stocks" className="gap-2">
            <Box className="h-4 w-4" />
            État des Stocks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendeurs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Liste du Personnel</CardTitle>
                <CardDescription>Gérants et vendeurs affiliés à cette boutique.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddingSeller(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Affilier un vendeur
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                isLoading={sellersQuery.isLoading}
                data={sellersQuery.data || []}
                columns={[
                  { accessorKey: "email", header: "Email" },
                  { accessorKey: "first_name", header: "Prénom" },
                  { accessorKey: "last_name", header: "Nom" },
                  { 
                    accessorKey: "role", 
                    header: "Rôle",
                    cell: ({ row }) => {
                      const data = row.original as any;
                      return (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          data.role === 'gerant' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {data.role === 'gerant' ? 'Gérant' : 'Vendeur'}
                        </span>
                      );
                    }
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ventes">
          <Card>
            <CardHeader>
              <CardTitle>Journal des Ventes</CardTitle>
              <CardDescription>Historique des transactions réalisées dans cette boutique.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                isLoading={salesQuery.isLoading}
                data={salesQuery.data || []}
                columns={[
                  { 
                    accessorKey: "date_vente", 
                    header: "Date",
                    cell: ({ row }) => formatDateFr((row.original as any).date_vente)
                  },
                  { accessorKey: "code_facture", header: "Facture" },
                  { accessorKey: "client_nom", header: "Client" },
                  { 
                    accessorKey: "montant_total", 
                    header: "Total",
                    cell: ({ row }) => formatGNF((row.original as any).montant_total)
                  },
                  { 
                    accessorKey: "statut_paiement", 
                    header: "Paiement",
                    cell: ({ row }) => {
                      const data = row.original as any;
                      return (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          data.statut_paiement === 'paye' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {data.statut_paiement === 'paye' ? 'Payé' : 'Impayé'}
                        </span>
                      );
                    }
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stocks">
          <Card>
            <CardHeader>
              <CardTitle>Inventaire Local</CardTitle>
              <CardDescription>Quantités actuelles des produits en stock dans cette boutique.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                isLoading={stocksQuery.isLoading}
                data={stocksQuery.data || []}
                columns={[
                  { accessorKey: "produit_nom", header: "Produit" },
                  { 
                    accessorKey: "quantite_actuelle", 
                    header: "Quantité",
                    cell: ({ row }) => {
                      const data = row.original as any;
                      return `${data.quantite_actuelle} ${data.unite || 'unité'}`;
                    }
                  },
                  { 
                    accessorKey: "valeur_estimee", 
                    header: "Valeur Est.",
                    cell: ({ row }) => formatGNF((row.original as any).valeur_estimee)
                  },
                  { 
                    accessorKey: "seuil_alerte", 
                    header: "Seuil Alerte"
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddingSeller} onOpenChange={setIsAddingSeller}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Affilier un vendeur</DialogTitle>
            <DialogDescription>
              Rattachez un membre du personnel à la boutique <strong>{boutique.nom}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="py-2">
            <Tabs value={affiliationMode} onValueChange={(val) => setAffiliationMode(val as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">Nouveau compte</TabsTrigger>
                <TabsTrigger value="existing">Utilisateur existant</TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="space-y-4 pt-4">
                <ResourceForm
                  fields={sellerFields}
                  isSaving={saveSellerMutation.isPending}
                  onSubmit={(payload) => saveSellerMutation.mutate(payload)}
                />
              </TabsContent>

              <TabsContent value="existing" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sélectionner l&apos;utilisateur</Label>
                    <Select value={selecteduserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un utilisateur de l'organisation" />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsersQuery.data?.map((user: any) => (
                          <SelectItem key={user.id} value={String(user.id)}>
                            {user.email} ({user.first_name} {user.last_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Rôle dans cette boutique</Label>
                    <Select value={existingUserRole} onValueChange={setExistingUserRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gerant">Gérant</SelectItem>
                        <SelectItem value="vendeur">Vendeur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingSeller(false)} disabled={saveSellerMutation.isPending}>
              Annuler
            </Button>
            <Button 
              type={affiliationMode === "new" ? "submit" : "button"} 
              form={affiliationMode === "new" ? "resource-form" : undefined} 
              disabled={saveSellerMutation.isPending || (affiliationMode === "existing" && !selecteduserId)}
              onClick={affiliationMode === "existing" ? () => saveSellerMutation.mutate({}) : undefined}
            >
              {saveSellerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : "Affilier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

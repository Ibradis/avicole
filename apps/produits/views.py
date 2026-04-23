# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import Produit
from .serializers import ProduitReadSerializer, ProduitWriteSerializer
from apps.utilisateurs.permissions import IsOrganisationAdminOrReadOnly

class ProduitListView(APIView):
    permission_classes = [IsAuthenticated, IsOrganisationAdminOrReadOnly]

    @extend_schema(
        summary="Lister les produits",
        description="Récupère le catalogue des produits (œufs, aliments, vaccins, etc.) avec la possibilité de filtrer par type et par statut actif.",
        responses={200: ProduitReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Produit.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
        elif request.user.entite_type == 'ferme' and request.user.entite_id:
            queryset = queryset.filter(entite_type='ferme', entite_id=request.user.entite_id)

        type_produit = request.query_params.get('type')
        if type_produit:
            queryset = queryset.filter(type=type_produit)
        actif = request.query_params.get('actif')
        if actif is not None:
            queryset = queryset.filter(actif=(actif.lower() == 'true'))

        serializer = ProduitReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Créer un nouveau produit",
        description="Ajoute une nouvelle référence au référentiel des produits avec son type logique et prix initial.",
        request=ProduitWriteSerializer, 
        responses={201: ProduitReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = ProduitWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            extra_data["entite_type"] = 'boutique'
            extra_data["entite_id"] = request.user.entite_id
        elif request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        produit = serializer.save(**extra_data)
        return Response(ProduitReadSerializer(produit).data, status=status.HTTP_201_CREATED)

class ProduitDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOrganisationAdminOrReadOnly]

    def get_object(self, pk):
        return get_object_or_404(Produit, pk=pk)

    @extend_schema(
        summary="Détails du produit",
        description="Visionner de façon ciblée la fiche d'un produit selon sa clé primaire (ID).",
        responses={200: ProduitReadSerializer}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        produit = self.get_object(pk)
        data = ProduitReadSerializer(produit).data
        data = dict(data)

        # --- Achats liés ---
        from apps.achats.models import LigneAchat
        achats = LigneAchat.objects.filter(
            produit=produit,
            achat__organisation=request.user.organisation
        ).select_related('achat', 'achat__fournisseur').order_by('-achat__date_achat')

        data['achats'] = [
            {
                'id': la.achat.id,
                'reference': la.achat.reference or f'ACHAT-{la.id}',
                'date': str(la.achat.date_achat),
                'fournisseur': la.achat.fournisseur.nom,
                'quantite': float(la.quantite),
                'prix_unitaire': float(la.prix_unitaire),
                'total': float(la.sous_total),
                'statut': la.achat.statut,
            } for la in achats
        ]

        # --- Ventes liées ---
        from apps.ventes.models import LigneVente
        ventes = LigneVente.objects.filter(
            produit=produit,
            vente__organisation=request.user.organisation
        ).select_related('vente', 'vente__client').order_by('-vente__date_vente')

        data['ventes'] = [
            {
                'id': lv.vente.id,
                'reference': lv.vente.reference or f'VENTE-{lv.vente.id}',
                'date': str(lv.vente.date_vente),
                'client': lv.vente.client.nom if lv.vente.client else 'Client divers',
                'quantite': float(lv.quantite),
                'prix_unitaire': float(lv.prix_unitaire),
                'total': float(lv.sous_total),
                'statut': lv.vente.statut,
            } for lv in ventes
        ]

        # --- Mouvements de stock ---
        from apps.stocks.models import MouvementStock, Stock
        mouvements = MouvementStock.objects.filter(
            produit=produit,
            organisation=request.user.organisation
        ).order_by('-date_mouvement', '-created_at')[:50]

        data['mouvements_stock'] = [
            {
                'id': m.id,
                'date': str(m.date_mouvement),
                'type': m.type_mouvement,
                'quantite': float(m.quantite),
                'reference': m.reference,
                'entite': f"{m.get_entite_type_display()} {m.entite_id}", # Simplifié
            } for m in mouvements
        ]

        # --- État actuel des stocks ---
        stocks = Stock.objects.filter(produit=produit, organisation=request.user.organisation)
        data['stocks'] = [
            {
                'entite': f"{s.get_entite_type_display()} {s.entite_id}",
                'quantite': float(s.quantite_actuelle),
                'seuil': float(s.seuil_alerte),
            } for s in stocks
        ]

        return Response(data)


    @extend_schema(
        summary="Mettre à jour un produit",
        description="Permet de modifier dynamiquement les caractéristiques techniques du produit visé. (ex. augmenter le prix de vente)",
        request=ProduitWriteSerializer, 
        responses={200: ProduitReadSerializer}
    )
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = ProduitWriteSerializer(
            self.get_object(pk), data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        produit = serializer.save(organisation=request.user.organisation)
        return Response(ProduitReadSerializer(produit).data)

    @extend_schema(
        summary="Rendre un produit inactif",
        description="Exécute une suppression psychologique (soft delete). Le produit ne sera plus listable immédiatement mais l'historique est conservé.",
        responses={204: None}
    )
    # Fonction de suppression (DELETE) logique ou physique
    def delete(self, request, pk):
        produit = self.get_object(pk)
        produit.actif = False # Soft delete
        produit.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

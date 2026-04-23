# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from django.db.models import F
from .models import Stock, MouvementStock
from .serializers import (
    StockReadSerializer, StockWriteSerializer,
    MouvementStockReadSerializer, MouvementStockWriteSerializer
)

class StockListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Observatoire des Stocks (Global)",
        description="Le compte global calculé des articles/marchandises tangibles.",
        responses={200: StockReadSerializer(many=True)}
    )
    def get(self, request):
        queryset = Stock.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (Auto ou manuel via query params pour admin)
        entite_type = request.query_params.get('entite_type')
        entite_id = request.query_params.get('entite_id')
        
        if request.user.role == 'pdg':
            queryset = queryset.filter(entite_type='ferme')
        elif request.user.role == 'admin' and entite_type and entite_id:
            queryset = queryset.filter(entite_type=entite_type, entite_id=entite_id)
        elif request.user.entite_type and request.user.entite_id:
            queryset = queryset.filter(entite_type=request.user.entite_type, entite_id=request.user.entite_id)
        
        # Filtre optionnel par type de produit
        produit_type = request.query_params.get('type')
        if produit_type:
            queryset = queryset.filter(produit__type=produit_type)
        
        serializer = StockReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

class StockDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Stock, pk=pk)

    @extend_schema(summary="Détail du Stock Local", responses={200: StockReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = StockReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(summary="Correction Exceptionnelle du Stock", request=StockWriteSerializer, responses={200: StockReadSerializer})
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = StockWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(organisation=request.user.organisation)
        return Response(serializer.data)

class StockAlertesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Poste d'Alertes Ruine/Manque",
        description="Affiche instantanément les marchandises dont la quantite actuelle s'approche ou tombe sous le seuil critique défini au préalable.",
        responses={200: StockReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        # quantite_actuelle <= seuil_alerte
        queryset = Stock.objects.filter(quantite_actuelle__lte=F('seuil_alerte'))
        serializer = StockReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

class MouvementStockListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Cahier de Brouillons et Historique des Mouvements",
        description="Liste inaltérable des évènements entrées/sorties touchant physiquement à la logistique des marchandises.",
        responses={200: MouvementStockReadSerializer(many=True)}
    )
    def get(self, request):
        queryset = MouvementStock.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (Auto ou manuel via query params pour admin)
        entite_type = request.query_params.get('entite_type')
        entite_id = request.query_params.get('entite_id')
        
        if request.user.role in ('admin', 'pdg') and entite_type and entite_id:
            queryset = queryset.filter(entite_type=entite_type, entite_id=entite_id)
        elif request.user.entite_type and request.user.entite_id:
            queryset = queryset.filter(entite_type=request.user.entite_type, entite_id=request.user.entite_id)
            
        serializer = MouvementStockReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Correction de Stock / Mouvement Manuel",
        request=MouvementStockWriteSerializer,
        responses={201: MouvementStockReadSerializer}
    )
    def post(self, request):
        serializer = MouvementStockWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            extra_data["entite_type"] = 'boutique'
            extra_data["entite_id"] = request.user.entite_id
        elif request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        mvt = serializer.save(**extra_data)
        return Response(MouvementStockReadSerializer(mvt).data, status=status.HTTP_201_CREATED)

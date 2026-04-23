# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import Consommation
from .serializers import ConsommationReadSerializer, ConsommationWriteSerializer

class ConsommationListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Suivi des rations alimentaires",
        description="Visualiser la liste des apports en aliments (eau + sacs de nourriture) enregistrés quotidiennement aux lots de volailles.",
        responses={200: ConsommationReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Consommation.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (v18.0)
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
            
        serializer = ConsommationReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Déclarer une Consommation",
        description="Associer une quantité de nourriture et la lie directement au coût global si l'aliment est imputé du sous-système de stock.",
        request=ConsommationWriteSerializer, 
        responses={201: ConsommationReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = ConsommationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            extra_data["entite_type"] = 'boutique'
            extra_data["entite_id"] = request.user.entite_id
        elif request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        conso = serializer.save(**extra_data)
        return Response(ConsommationReadSerializer(conso).data, status=status.HTTP_201_CREATED)

class ConsommationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Consommation, pk=pk)

    @extend_schema(
        summary="Détail Consommation",
        description="Obtenir le ticket détaillé du relevé alimentaire sélectionné.",
        responses={200: ConsommationReadSerializer}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = ConsommationReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(
        summary="Ajuster Consommation",
        description="Modifier les valeurs en cas de comptage inexact avéré par le technicien le jour même.",
        request=ConsommationWriteSerializer, 
        responses={200: ConsommationReadSerializer}
    )
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = ConsommationWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        conso = serializer.save(organisation=request.user.organisation)
        return Response(ConsommationReadSerializer(conso).data)

    @extend_schema(summary="Supprimer une consommation", responses={204: None})
    def delete(self, request, pk):
        conso = self.get_object(pk)
        conso.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

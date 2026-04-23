# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import Veterinaire, Contrat, Intervention
from .serializers import (
    VeterinaireReadSerializer, VeterinaireWriteSerializer,
    ContratReadSerializer, ContratWriteSerializer,
    InterventionReadSerializer, InterventionWriteSerializer
)

class VeterinaireListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Répertoire des Vétérinaires",
        description="Index de tous les vétérinaires rattachés par contact à l'entité de la ferme.",
        responses={200: VeterinaireReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Veterinaire.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (v18.0)
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
            
        serializer = VeterinaireReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Ajouter un Médecin Vétérinaire",
        description="Placer un nouveau praticien ou cabinet médical associé pour futures visites.",
        request=VeterinaireWriteSerializer, responses={201: VeterinaireReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = VeterinaireWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            extra_data["entite_type"] = 'boutique'
            extra_data["entite_id"] = request.user.entite_id
        elif request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        serializer.save(**extra_data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class VeterinaireDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Veterinaire, pk=pk)

    @extend_schema(summary="Fiche du Praticien", responses={200: VeterinaireReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = VeterinaireReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(summary="Modifier Praticien", request=VeterinaireWriteSerializer, responses={200: VeterinaireReadSerializer})
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = VeterinaireWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(organisation=request.user.organisation)
        return Response(serializer.data)

    @extend_schema(summary="Supprimer un vétérinaire", responses={204: None})
    def delete(self, request, pk):
        veterinaire = self.get_object(pk)
        veterinaire.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContratListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Registre des Contrats de Santé",
        description="Visionnez tous les engagements de contrat souscrits ou passés de cabinet vétérinaire qui stipulent mensualités et récurrences.",
        responses={200: ContratReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Contrat.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (v18.0)
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
            
        serializer = ContratReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Nouveau Contrat Médecin",
        description="Liez immédiatement un engagement financier structurel (coût et date) associant vétérinaire et ferme.",
        request=ContratWriteSerializer, responses={201: ContratReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = ContratWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            extra_data["entite_type"] = 'boutique'
            extra_data["entite_id"] = request.user.entite_id
        elif request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        serializer.save(**extra_data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ContratDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Contrat, pk=pk)

    @extend_schema(summary="Détail Contrat", responses={200: ContratReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = ContratReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(summary="Mettre à Jour Contrat", request=ContratWriteSerializer, responses={200: ContratReadSerializer})
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = ContratWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(organisation=request.user.organisation)
        return Response(serializer.data)

    @extend_schema(summary="Supprimer un contrat vétérinaire", responses={204: None})
    def delete(self, request, pk):
        contrat = self.get_object(pk)
        contrat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class InterventionListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Historique des Interventions Médicales",
        description="Chaque autopsie, diagnostic ou déplacement imprévu y causant facturation et audit sanitaire.",
        responses={200: InterventionReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Intervention.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (v18.0)
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
            
        serializer = InterventionReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Déclarer une visite et Intervention",
        description="Assigne l'intervention à la facture, causant une entrée pure d'exploitation financière optionnellement.",
        request=InterventionWriteSerializer, responses={201: InterventionReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = InterventionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            extra_data["entite_type"] = 'boutique'
            extra_data["entite_id"] = request.user.entite_id
        elif request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        serializer.save(**extra_data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class InterventionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Intervention, pk=pk)

    @extend_schema(summary="Détail de l'Acte", responses={200: InterventionReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = InterventionReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(summary="Correction d'Acte", request=InterventionWriteSerializer, responses={200: InterventionReadSerializer})
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = InterventionWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(organisation=request.user.organisation)
        return Response(serializer.data)

    @extend_schema(summary="Supprimer une intervention vétérinaire", responses={204: None})
    def delete(self, request, pk):
        intervention = self.get_object(pk)
        intervention.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

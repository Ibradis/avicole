# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import Vaccination, Traitement, Mortalite
from .serializers import (
    VaccinationReadSerializer, VaccinationWriteSerializer,
    TraitementReadSerializer, TraitementWriteSerializer,
    MortaliteReadSerializer, MortaliteWriteSerializer
)

class VaccinationListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Cahier de Vaccinations",
        description="Lister et filtrer toutes les vaccinations administrées ou devant être planifiées par lots sanitaires.",
        responses={200: VaccinationReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Vaccination.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (v18.0)
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
            
        serializer = VaccinationReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Planifier / Déclarer un Vaccin",
        description="Historiser la méthode d'administration vaccinale (Intramusculaire, Aile) à un Lot entier.",
        request=VaccinationWriteSerializer, 
        responses={201: VaccinationReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = VaccinationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            extra_data["entite_type"] = 'boutique'
            extra_data["entite_id"] = request.user.entite_id
        elif request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        vaccin = serializer.save(**extra_data)
        return Response(VaccinationReadSerializer(vaccin).data, status=status.HTTP_201_CREATED)

class VaccinationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Vaccination, pk=pk)

    @extend_schema(summary="Détail Vaccination", responses={200: VaccinationReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = VaccinationReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(summary="Modifier Vaccination", request=VaccinationWriteSerializer, responses={200: VaccinationReadSerializer})
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = VaccinationWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        vaccin = serializer.save(organisation=request.user.organisation)
        return Response(VaccinationReadSerializer(vaccin).data)

    @extend_schema(summary="Supprimer une vaccination", responses={204: None})
    def delete(self, request, pk):
        vaccin = self.get_object(pk)
        vaccin.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class TraitementListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Cahier de Traitements",
        description="Liste des thérapies curatives (vitamines, anti-bactériens) appliquées unitairement sur les cheptels.",
        responses={200: TraitementReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Traitement.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (v18.0)
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
            
        serializer = TraitementReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Planifier / Déclarer un Traitement",
        description="Ajouter un traitement antibiotique ou curatif au processus de suivi vétérinaire.",
        request=TraitementWriteSerializer, 
        responses={201: TraitementReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = TraitementWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            extra_data["entite_type"] = 'boutique'
            extra_data["entite_id"] = request.user.entite_id
        elif request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        traitement = serializer.save(**extra_data)
        return Response(TraitementReadSerializer(traitement).data, status=status.HTTP_201_CREATED)

class TraitementDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Traitement, pk=pk)

    @extend_schema(summary="Détail Thérapeutique", responses={200: TraitementReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = TraitementReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(summary="Modifier Thérapie", request=TraitementWriteSerializer, responses={200: TraitementReadSerializer})
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = TraitementWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        trait = serializer.save(organisation=request.user.organisation)
        return Response(TraitementReadSerializer(trait).data)

    @extend_schema(summary="Supprimer un traitement", responses={204: None})
    def delete(self, request, pk):
        traitement = self.get_object(pk)
        traitement.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MortaliteListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Liste des Perdes et Mortalité",
        description="Voir la baisse drastique d'inventaire consécutive au taux naturel de perte volaille. Déduit automatiquement la 'quantite_actuelle' du lot en cours.",
        responses={200: MortaliteReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Mortalite.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (v18.0)
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
            
        serializer = MortaliteReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Déclarer des Pertes",
        description="Inscrire N sujets morts ce jour pour justifier l'ajustement du cheptel.",
        request=MortaliteWriteSerializer, 
        responses={201: MortaliteReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = MortaliteWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            extra_data["entite_type"] = 'boutique'
            extra_data["entite_id"] = request.user.entite_id
        elif request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        mort = serializer.save(**extra_data)
        return Response(MortaliteReadSerializer(mort).data, status=status.HTTP_201_CREATED)

class MortaliteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Mortalite, pk=pk)

    @extend_schema(summary="Détail Pertes", responses={200: MortaliteReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = MortaliteReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(summary="Modifier une mortalité", request=MortaliteWriteSerializer, responses={200: MortaliteReadSerializer})
    def patch(self, request, pk):
        serializer = MortaliteWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        mort = serializer.save(organisation=request.user.organisation)
        return Response(MortaliteReadSerializer(mort).data)

    @extend_schema(summary="Supprimer une mortalité", responses={204: None})
    def delete(self, request, pk):
        mort = self.get_object(pk)
        mort.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

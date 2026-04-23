# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import Boutique
from .serializers import BoutiqueReadSerializer, BoutiqueWriteSerializer
from apps.utilisateurs.permissions import IsOrganisationAdminOrReadOnly

class BoutiqueListView(APIView):
    permission_classes = [IsAuthenticated, IsOrganisationAdminOrReadOnly]

    @extend_schema(
        summary="Catalogue des Boutiques",
        description="Collecte la liste du parc multi-boutiques géré sur notre interface SaaS principale.",
        responses={200: BoutiqueReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Boutique.objects.filter(organisation=request.user.organisation)
        serializer = BoutiqueReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Initier une nouvelle Boutique",
        description="Sauvegardez l'apparition d'un nouveau point de vente dans les territoires couverts par l'exploitation avicole.",
        request=BoutiqueWriteSerializer, 
        responses={201: BoutiqueReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = BoutiqueWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        boutique = serializer.save(organisation=request.user.organisation)
        return Response(BoutiqueReadSerializer(boutique).data, status=status.HTTP_201_CREATED)

class BoutiqueDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOrganisationAdminOrReadOnly]

    def get_object(self, pk):
        return get_object_or_404(Boutique, pk=pk)

    @extend_schema(
        summary="Inspection Boutique",
        description="Extrait de base pour repérer l'unique composante identifiée avec ses metadata complètes.",
        responses={200: BoutiqueReadSerializer}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = BoutiqueReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(
        summary="Édition d'une Boutique",
        description="Soumettez un changement pour ajuster par exemple l'email, ou le téléphone.",
        request=BoutiqueWriteSerializer, 
        responses={200: BoutiqueReadSerializer}
    )
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = BoutiqueWriteSerializer(
            self.get_object(pk), data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        boutique = serializer.save(organisation=request.user.organisation)
        return Response(BoutiqueReadSerializer(boutique).data)

    @extend_schema(
        summary="Désactivation d'une Boutique",
        description="Ferme une boutique de l'exploitation. Rendent la clé inaccessible pour certaines liaisons inter-caisse.",
        responses={204: None}
    )
    # Fonction de suppression (DELETE) logique ou physique
    def delete(self, request, pk):
        boutique = self.get_object(pk)
        boutique.actif = False
        boutique.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

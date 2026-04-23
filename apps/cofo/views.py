# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import CofoOperation
from .serializers import CofoOperationReadSerializer, CofoOperationWriteSerializer

class CofoOperationListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Cahier de Gestion COFO (Matières Premières et Ingrédients)",
        description="Un registre d'achat parallèle permettant d'approvisionner par flux la fabrication et transformation de mélanges artisanaux.",
        responses={200: CofoOperationReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = CofoOperation.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (v18.0)
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
            
        serializer = CofoOperationReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Inscrire une Opération COFO",
        description="Déclarer une livraison facturable pour vos produits COFO (par achats ou par ventes).",
        request=CofoOperationWriteSerializer, 
        responses={201: CofoOperationReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = CofoOperationWriteSerializer(data=request.data)
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

class CofoOperationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(CofoOperation, pk=pk)

    @extend_schema(summary="Consultation COFO", responses={200: CofoOperationReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = CofoOperationReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(summary="Modification Ticket COFO", request=CofoOperationWriteSerializer, responses={200: CofoOperationReadSerializer})
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = CofoOperationWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(organisation=request.user.organisation)
        return Response(serializer.data)

    @extend_schema(summary="Supprimer une opération COFO", responses={204: None})
    def delete(self, request, pk):
        operation = self.get_object(pk)
        operation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

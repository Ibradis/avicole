# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import TypeCharge
from .serializers import TypeChargeReadSerializer, TypeChargeWriteSerializer

class TypeChargeListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Base de Types de Charges Diverses",
        description="Recense un arbre comptable paramétrable pour catégoriser vos flux de soustraction monétaire (ex: Électricité, Prime employé, Essence).",
        responses={200: TypeChargeReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = TypeCharge.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (v18.0)
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
            
        actif = request.query_params.get('actif')
        if actif is not None:
             queryset = queryset.filter(actif=(actif.lower() == 'true'))
        serializer = TypeChargeReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Créer un Type de Charge",
        description="Incorporez une nouvelle nature de frais pour les bilans comptables futurs.",
        request=TypeChargeWriteSerializer, 
        responses={201: TypeChargeReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = TypeChargeWriteSerializer(data=request.data)
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

class TypeChargeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(TypeCharge, pk=pk)

    @extend_schema(summary="Détail Type de Charge", responses={200: TypeChargeReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        from apps.finances.models import MouvementCaisse
        from django.db.models import Sum
        
        charge = self.get_object(pk)
        data = TypeChargeReadSerializer(charge).data
        
        # Mouvements liés
        mouvements = MouvementCaisse.objects.filter(
            id_type_charge=charge,
            organisation=request.user.organisation
        ).order_by('-date_mouvement')[:100]
        
        # Total des dépenses
        total = mouvements.aggregate(Sum('montant'))['montant__sum'] or 0
        
        data['total_depenses'] = float(total)
        data['mouvements'] = [
            {
                'id': m.id,
                'date': str(m.date_mouvement),
                'montant': float(m.montant),
                'description': m.description or '',
                'portefeuille_nom': m.source_id.nom if m.source_id else '—',
                'effectue_par': m.created_by.get_full_name() if m.created_by else '—',
            } for m in mouvements
        ]
        
        return Response(data)

    @extend_schema(summary="Mise à Jour de Type Charge", request=TypeChargeWriteSerializer, responses={200: TypeChargeReadSerializer})
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = TypeChargeWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(organisation=request.user.organisation)
        return Response(serializer.data)

    @extend_schema(summary="Supprimer un type de charge", responses={204: None})
    def delete(self, request, pk):
        charge = self.get_object(pk)
        charge.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

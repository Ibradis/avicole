# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import Achat
from .serializers import AchatReadSerializer, AchatWriteSerializer

class AchatListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Cahier de Vente Constructif / B2B (Achats)",
        description="Le grand registre des réapprovisionnements structurés (factures d'import, aliments industriels, équipements). Les dettes générées par les achats non payés impactent les fournisseurs.",
        responses={200: AchatReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Achat.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (Auto ou manuel via query params pour admin)
        entite_type = request.query_params.get('entite_type')
        entite_id = request.query_params.get('entite_id')
        
        if request.user.role == 'pdg':
            queryset = queryset.filter(entite_type='ferme')
        elif request.user.role == 'admin' and entite_type and entite_id:
            queryset = queryset.filter(entite_type=entite_type, entite_id=entite_id)
        elif request.user.entite_type and request.user.entite_id:
            queryset = queryset.filter(entite_type=request.user.entite_type, entite_id=request.user.entite_id)
            
        serializer = AchatReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Faire un Achat avec Sous-Lignes Commande",
        description="La requête POST accepte le corps `lignes_data` comprenant une liste array (produit_id, quantite, prix). Le montant total est déduit tout seul.",
        request=AchatWriteSerializer, 
        responses={201: AchatReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = AchatWriteSerializer(data=request.data, context={'request': request})
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

class AchatDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Achat, pk=pk)

    @extend_schema(
        summary="Informations Détaillées d'Achat",
        description="Le serveur incorpore dynamiquement et lit les lignes enfant issues de cette facture d'achat.",
        responses={200: AchatReadSerializer}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        from apps.finances.models import MouvementCaisse
        achat = self.get_object(pk)
        serializer = AchatReadSerializer(achat)
        data = dict(serializer.data)
        # Uniquement les paiements directement liés à cet achat
        mouvements = MouvementCaisse.objects.filter(
            reference_table='achats',
            reference_id=achat.id,
            source_type='portefeuille'
        ).select_related('source_id').order_by('date_mouvement')
        data['mouvements'] = [
            {
                'id': m.id,
                'date': str(m.date_mouvement),
                'montant': float(m.montant),
                'caisse': m.source_id.nom if m.source_id else '-',
                'description': m.description or ''
            } for m in mouvements
        ]
        return Response(data)

    @extend_schema(summary="Altérer Métatdonnées d'un Achat", request=AchatWriteSerializer, responses={200: AchatReadSerializer})
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = AchatWriteSerializer(self.get_object(pk), data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        achat = serializer.save(organisation=request.user.organisation)
        return Response(AchatReadSerializer(achat).data)

    @extend_schema(summary="Supprimer un achat", responses={204: None})
    def delete(self, request, pk):
        achat = self.get_object(pk)
        achat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AchatValiderView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Valider la Réception de l'Achat",
        description="Impacte le stock et le solde fournisseur. Génère les mouvements de stock et de dette.",
        responses={200: dict}
    )
    def post(self, request, pk):
        from apps.common.services import StockService, FinanceService
        achat = get_object_or_404(Achat, pk=pk, organisation=request.user.organisation)
        
        if achat.statut != 'brouillon':
            return Response({"detail": "Seul un achat en brouillon peut être validé."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Ajustement du stock pour chaque ligne
        for ligne in achat.lignes.all():
            StockService.adjust_stock(
                produit=ligne.produit,
                entite_type=achat.entite_type,
                entite_id=achat.entite_id,
                organisation=achat.organisation,
                delta_quantite=ligne.quantite,
                type_mouvement='entree',
                reference=achat.reference or f"ACHAT-{achat.id}",
                observations=f"Réception Achat #{achat.id}"
            )
            
        # 2. Enregistrement de la dette fournisseur (Finance)
        FinanceService.record_movement(
            organisation=achat.organisation,
            montant=achat.montant_total,
            nature='achat',
            source_type='tiers', # Création de la dette
            dest_type='tiers',   # Vers le fournisseur
            description=f"Dette Achat {achat.reference or achat.id}",
            created_by=request.user,
            reference_table='achats',
            reference_id=achat.id
        )
        
        achat.statut = 'valide'
        import datetime
        achat.date_reception = datetime.date.today()
        achat.save()
        
        # 3. Mettre à jour la vente parente si c'est un transfert interne
        if achat.vente_fournisseuse:
            v = achat.vente_fournisseuse
            v.reception_confirmee = True
            v.date_reception = achat.date_reception
            v.save()
        
        return Response({"detail": "Achat validé et réceptionné.", "statut": achat.statut})

class AchatPayerView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Enregistrer un Paiement pour l'Achat",
        description="Crée un mouvement de caisse et met à jour le solde fournisseur et le statut de paiement de l'achat.",
        request=dict, responses={200: dict}
    )
    def post(self, request, pk):
        from apps.common.services import FinanceService
        from apps.finances.models import Portefeuille
        from decimal import Decimal
        
        achat = get_object_or_404(Achat, pk=pk, organisation=request.user.organisation)
        montant = Decimal(str(request.data.get('montant', 0)))
        portefeuille_id = request.data.get('portefeuille_id')
        
        if not portefeuille_id:
            return Response({"detail": "ID du portefeuille requis."}, status=status.HTTP_400_BAD_REQUEST)
        if montant <= 0:
            return Response({"detail": "Montant invalide."}, status=status.HTTP_400_BAD_REQUEST)
            
        portefeuille = get_object_or_404(Portefeuille, id=portefeuille_id, organisation=request.user.organisation)

        # Vérification du solde disponible
        if portefeuille.solde_actuel < montant:
            return Response(
                {"detail": f"Solde insuffisant. Solde disponible : {float(portefeuille.solde_actuel):,.0f} GNF, montant demandé : {float(montant):,.0f} GNF."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Enregistrement financier (Paiement effectif)
        FinanceService.record_movement(
            organisation=achat.organisation,
            montant=montant,
            nature='achat',
            source_type='portefeuille',
            source_id=portefeuille,
            dest_type='tiers', # On paie le fournisseur
            description=f"Paiement Achat {achat.reference or achat.id}",
            created_by=request.user,
            reference_table='achats',
            reference_id=achat.id
        )
        
        # 2. Mise à jour du statut de paiement de l'achat (Calcul réel par sommation)
        from apps.finances.models import MouvementCaisse
        from django.db.models import Sum
        
        total_paye = MouvementCaisse.objects.filter(
            reference_table='achats',
            reference_id=achat.id,
            source_type='portefeuille'
        ).aggregate(total=Sum('montant'))['total'] or 0
        
        if total_paye >= achat.montant_total:
            achat.statut_paiement = 'paye'
        elif total_paye > 0:
            achat.statut_paiement = 'partiel'
        else:
            achat.statut_paiement = 'en_attente'
            
        achat.save()
        
        return Response({"detail": "Paiement enregistré.", "statut_paiement": achat.statut_paiement})

# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import Vente
from .serializers import VenteReadSerializer, VenteWriteSerializer

class VenteListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Cahier de Recettes / Ventes (Produits d'Exploitation)",
        description="Affiche le grand livre des ventes sortantes multi-boutiques et ferme. Impacte positivement l'inventaire monétaire et décrémente les stocks locaux.",
        responses={200: VenteReadSerializer(many=True)}
    )
    def get(self, request):
        queryset = Vente.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (Auto ou manuel via query params pour admin)
        entite_type = request.query_params.get('entite_type')
        entite_id = request.query_params.get('entite_id')
        
        if request.user.role == 'pdg':
            queryset = queryset.filter(entite_type='ferme')
        elif request.user.role == 'admin' and entite_type and entite_id:
            queryset = queryset.filter(entite_type=entite_type, entite_id=entite_id)
        elif request.user.entite_type and request.user.entite_id:
            queryset = queryset.filter(entite_type=request.user.entite_type, entite_id=request.user.entite_id)
            
        serializer = VenteReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Soumettre Fiche de Vente",
        description="Sélectionner plusieurs produits et leurs quantités sous `lignes_data`, le serveur additionne le cout de la transaction et la scelle aux bénéfices.",
        request=VenteWriteSerializer, 
        responses={201: VenteReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = VenteWriteSerializer(data=request.data, context={'request': request})
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

class VenteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Vente, pk=pk)

    @extend_schema(summary="Détail Ticket de Caisse", responses={200: VenteReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        from apps.finances.models import MouvementCaisse
        vente = self.get_object(pk)
        serializer = VenteReadSerializer(vente)
        data = dict(serializer.data)
        # Uniquement les paiements directement liés à cette vente
        mouvements = MouvementCaisse.objects.filter(
            reference_table='ventes',
            reference_id=vente.id,
            dest_type='portefeuille'
        ).select_related('dest_id').order_by('date_mouvement')
        data['mouvements'] = [
            {
                'id': m.id,
                'date': str(m.date_mouvement),
                'montant': float(m.montant),
                'caisse': m.dest_id.nom if m.dest_id else '-',
                'description': m.description or ''
            } for m in mouvements
        ]
        return Response(data)

    @extend_schema(summary="Modifier une vente", request=VenteWriteSerializer, responses={200: VenteReadSerializer})
    def patch(self, request, pk):
        serializer = VenteWriteSerializer(self.get_object(pk), data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        vente = serializer.save(organisation=request.user.organisation)
        return Response(VenteReadSerializer(vente).data)

    @extend_schema(summary="Supprimer une vente", responses={204: None})
    def delete(self, request, pk):
        vente = self.get_object(pk)
        vente.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class VenteValiderView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Valider la Livraison de la Vente",
        description="Impacte le stock et le solde client. Génère les mouvements de stock et de créance.",
        responses={200: dict}
    )
    def post(self, request, pk):
        from apps.common.services import StockService, FinanceService
        vente = get_object_or_404(Vente, pk=pk, organisation=request.user.organisation)
        
        if vente.statut != 'brouillon':
            return Response({"detail": "Seule une vente en brouillon peut être validée."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Ajustement du stock pour chaque ligne (Sortie)
        for ligne in vente.lignes.all():
            StockService.adjust_stock(
                produit=ligne.produit,
                entite_type=vente.entite_type,
                entite_id=vente.entite_id,
                organisation=vente.organisation,
                delta_quantite=ligne.quantite,
                type_mouvement='sortie',
                reference=vente.reference or f"VENTE-{vente.id}",
                observations=f"Livraison Vente #{vente.id}"
            )
            
        # 2. Enregistrement de la créance client (Finance)
        FinanceService.record_movement(
            organisation=vente.organisation,
            montant=vente.montant_total,
            nature='vente',
            source_type='tiers', # Créat de la créance
            dest_type='tiers',   # Créance
            description=f"Créance Vente {vente.reference or vente.id}",
            created_by=request.user,
            reference_table='ventes',
            reference_id=vente.id
        )
        
        # 3. Création automatique d'un Achat miroir si destination = Boutique
        if vente.boutique_dest:
            from apps.achats.models import Achat, LigneAchat
            achat_miroir = Achat.objects.create(
                organisation=vente.organisation,
                date_achat=vente.date_vente,
                reference=f"TRANSFERT-{vente.reference or vente.id}",
                montant_total=vente.montant_total,
                entite_type='boutique',
                entite_id=vente.boutique_dest.id,
                statut='brouillon',
                vente_fournisseuse=vente,
                observations=f"Transfert de la Ferme - Vente #{vente.id}"
            )
            for ligne in vente.lignes.all():
                LigneAchat.objects.create(
                    achat=achat_miroir,
                    produit=ligne.produit,
                    quantite=ligne.quantite,
                    prix_unitaire=ligne.prix_unitaire,
                    sous_total=ligne.sous_total
                )

        vente.statut = 'valide'
        import datetime
        vente.date_livraison = datetime.date.today()
        vente.save()
        
        return Response({"detail": "Bon de sortie validé. Achat miroir généré pour la boutique.", "statut": vente.statut})

class VentePayerView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Enregistrer un Paiement Client",
        description="Crée un mouvement de caisse et met à jour le solde client et le statut de paiement de la vente.",
        request=dict, responses={200: dict}
    )
    def post(self, request, pk):
        from apps.common.services import FinanceService
        from apps.finances.models import Portefeuille
        from decimal import Decimal
        
        vente = get_object_or_404(Vente, pk=pk, organisation=request.user.organisation)
        montant = Decimal(str(request.data.get('montant', 0)))
        portefeuille_id = request.data.get('portefeuille_id')
        
        if not portefeuille_id:
            return Response({"detail": "ID du portefeuille requis."}, status=status.HTTP_400_BAD_REQUEST)
        if montant <= 0:
            return Response({"detail": "Montant invalide."}, status=status.HTTP_400_BAD_REQUEST)
            
        portefeuille = get_object_or_404(Portefeuille, id=portefeuille_id, organisation=request.user.organisation)

        # 1. Enregistrement financier (Paiement reçu)
        FinanceService.record_movement(
            organisation=vente.organisation,
            montant=montant,
            nature='vente',
            source_type='tiers', # Provient du client
            dest_type='portefeuille',
            dest_id=portefeuille,
            description=f"Paiement Vente {vente.reference or vente.id}",
            created_by=request.user,
            reference_table='ventes',
            reference_id=vente.id
        )
        
        # 2. Mise à jour du statut de paiement (Calcul réel par sommation)
        from apps.finances.models import MouvementCaisse
        from django.db.models import Sum
        
        total_recu = MouvementCaisse.objects.filter(
            reference_table='ventes',
            reference_id=vente.id,
            dest_type='portefeuille'
        ).aggregate(total=Sum('montant'))['total'] or 0
        
        if total_recu >= vente.montant_total:
            vente.statut_paiement = 'paye'
        elif total_recu > 0:
            vente.statut_paiement = 'partiel'
        else:
            vente.statut_paiement = 'en_attente'
            
        vente.save()
        
        return Response({"detail": "Paiement client enregistré.", "statut_paiement": vente.statut_paiement})
class VenteRecevoirView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Confirmer la Réception (Boutique)",
        description="Action réservée à la boutique destinataire pour confirmer l'arrivée des produits et les intégrer à son stock local.",
        responses={200: dict}
    )
    def post(self, request, pk):
        from apps.common.services import StockService
        vente = get_object_or_404(Vente, pk=pk, organisation=request.user.organisation)
        
        if not vente.boutique_dest:
            return Response({"detail": "Cette vente n'est pas destinée à une boutique interne."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérification des droits (L'utilisateur doit être lié à la boutique destinataire)
        if request.user.role != 'admin' and (request.user.entite_type != 'boutique' or str(request.user.entite_id) != str(vente.boutique_dest.id)):
             return Response({"detail": "Vous n'êtes pas autorisé à confirmer la réception pour cette boutique."}, status=status.HTTP_403_FORBIDDEN)

        if vente.statut != 'valide':
            return Response({"detail": "La vente doit être validée par la ferme avant d'être reçue."}, status=status.HTTP_400_BAD_REQUEST)
            
        if vente.reception_confirmee:
            return Response({"detail": "La réception a déjà été confirmée."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Ajustement du stock pour la boutique (Entrée)
        for ligne in vente.lignes.all():
            StockService.adjust_stock(
                produit=ligne.produit,
                entite_type='boutique',
                entite_id=vente.boutique_dest.id,
                organisation=vente.organisation,
                delta_quantite=ligne.quantite,
                type_mouvement='entree',
                reference=vente.reference or f"RECP-{vente.id}",
                observations=f"Réception Vente #{vente.id} de la ferme"
            )
            
        vente.reception_confirmee = True
        import datetime
        vente.date_reception = datetime.date.today()
        vente.save()
        
        return Response({"detail": "Réception confirmée et stock mis à jour.", "reception_confirmee": True})

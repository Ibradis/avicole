# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Sum
from .models import Portefeuille, MouvementCaisse, DemandePaiementInterne
from .serializers import (
    PortefeuilleReadSerializer, PortefeuilleWriteSerializer,
    MouvementCaisseReadSerializer, MouvementCaisseWriteSerializer,
    DemandePaiementInterneReadSerializer, DemandePaiementInterneWriteSerializer
)
from apps.utilisateurs.permissions import IsOrganisationAdminOrReadOnly
from django.db.models import Q
from django.utils import timezone

def calculer_solde_portefeuille(portefeuille):
    solde = portefeuille.solde_init
    entrees = MouvementCaisse.objects.filter(dest_type='portefeuille', dest_id=portefeuille).aggregate(Sum('montant'))['montant__sum'] or 0
    sorties = MouvementCaisse.objects.filter(source_type='portefeuille', source_id=portefeuille).aggregate(Sum('montant'))['montant__sum'] or 0
    solde_actuel = solde + entrees - sorties
    portefeuille.solde_actuel = solde_actuel
    portefeuille.save()
    return solde_actuel

class PortefeuilleListView(APIView):
    permission_classes = [IsAuthenticated, IsOrganisationAdminOrReadOnly]

    @extend_schema(
        summary="Cahier des Portefeuilles (Caisses et Comptes en Banque)",
        description="Cette table unique unifie les comptes bancaires (Orange Money, Virement) avec la caisse monétaire locale du terrain. Tous les soldes affichés sont calculés dynamiquement sur base des mouvements sortants et entrants.",
        responses={200: PortefeuilleReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Portefeuille.objects.filter(organisation=request.user.organisation)
        if request.user.role == 'gerant' and not request.query_params.get('include_all'):
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
        elif request.user.role == 'pdg':
            queryset = queryset.filter(entite_type='ferme')
            
        serializer = PortefeuilleReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Ajouter une Caisse ou Banque",
        description="Initiez l'existence d'une ressource monétaire pour tracer vos liquidités. Fournissez le solde initial.",
        request=PortefeuilleWriteSerializer, 
        responses={201: PortefeuilleReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = PortefeuilleWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(organisation=request.user.organisation, solde_actuel=serializer.validated_data.get('solde_init', 0))
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class PortefeuilleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOrganisationAdminOrReadOnly]
    
    def get_object(self, pk):
        return get_object_or_404(Portefeuille, pk=pk)

    @extend_schema(summary="Détail Caisse/Banque", responses={200: PortefeuilleReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        pf = self.get_object(pk)
        # Recalculate balance
        calculer_solde_portefeuille(pf)
        data = dict(PortefeuilleReadSerializer(pf).data)

        # All movements where this wallet is source OR destination
        mouvements = MouvementCaisse.objects.filter(
            Q(source_type='portefeuille', source_id=pf) |
            Q(dest_type='portefeuille', dest_id=pf),
            organisation=request.user.organisation
        ).select_related('source_id', 'dest_id').order_by('-date_mouvement')[:100]

        data['mouvements'] = [
            {
                'id': m.id,
                'date': str(m.date_mouvement),
                'nature': m.get_nature_display(),
                'direction': 'entree' if (m.dest_type == 'portefeuille' and m.dest_id_id == pf.id) else 'sortie',
                'montant': float(m.montant),
                'description': m.description or '',
                'contrepartie': (
                    m.source_id.nom if (m.dest_type == 'portefeuille' and m.dest_id_id == pf.id and m.source_id)
                    else (m.dest_id.nom if m.dest_id else '—')
                ),
                'reference_table': m.reference_table or '',
                'reference_id': m.reference_id,
            } for m in mouvements
        ]
        return Response(data)


    @extend_schema(summary="Modifier Paramètres de la Caisse", request=PortefeuilleWriteSerializer, responses={200: PortefeuilleReadSerializer})
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = PortefeuilleWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(organisation=request.user.organisation)
        return Response(serializer.data)

    @extend_schema(summary="Supprimer une caisse ou banque", responses={204: None})
    def delete(self, request, pk):
        portefeuille = self.get_object(pk)
        portefeuille.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class PortefeuilleSoldeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Interrogatoire de Solde Exact",
        description="Force le recalcul des registres comptables pour une assurance absolue de la monnaie restante.",
        responses={200: dict}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        pf = get_object_or_404(Portefeuille, pk=pk)
        solde = calculer_solde_portefeuille(pf)
        return Response({'solde_actuel': solde})

class MouvementCaisseListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Livre de Mouvements de Caisse / Banque",
        description="La pierre angulaire comptable. Trace universellement le cheminement de l'argent vers (Tiers/Achat/Charges) ou depuis (Tiers/Ventes/Apport).",
        responses={200: MouvementCaisseReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = MouvementCaisse.objects.filter(organisation=request.user.organisation)
        if request.user.role == 'gerant':
            queryset = queryset.filter(
                Q(source_type='portefeuille', source_id__entite_type='boutique', source_id__entite_id=request.user.entite_id) |
                Q(dest_type='portefeuille', dest_id__entite_type='boutique', dest_id__entite_id=request.user.entite_id)
            )
        elif request.user.role == 'pdg':
            queryset = queryset.filter(
                Q(source_type='portefeuille', source_id__entite_type='ferme') |
                Q(dest_type='portefeuille', dest_id__entite_type='ferme')
            )
            
        serializer = MouvementCaisseReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Poster un Mouvement Monétaire",
        description="Ajoutez manuellement ou automatiquement une déduction/entrée (type: Vente/Charge/Transfert) affectant universellement le portefeuille parent.",
        request=MouvementCaisseWriteSerializer, 
        responses={201: MouvementCaisseReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = MouvementCaisseWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            mvt = serializer.save(organisation=request.user.organisation, created_by=request.user)
            if mvt.source_type == 'portefeuille' and mvt.source_id:
                calculer_solde_portefeuille(mvt.source_id)
            if mvt.dest_type == 'portefeuille' and mvt.dest_id:
                calculer_solde_portefeuille(mvt.dest_id)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

class MouvementCaisseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(MouvementCaisse, pk=pk)

    @extend_schema(summary="Détail Mouvement", responses={200: MouvementCaisseReadSerializer})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = MouvementCaisseReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(summary="Modifier un mouvement", request=MouvementCaisseWriteSerializer, responses={200: MouvementCaisseReadSerializer})
    def patch(self, request, pk):
        serializer = MouvementCaisseWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        mvt = serializer.save(organisation=request.user.organisation, created_by=request.user)
        if mvt.source_type == 'portefeuille' and mvt.source_id:
            calculer_solde_portefeuille(mvt.source_id)
        if mvt.dest_type == 'portefeuille' and mvt.dest_id:
            calculer_solde_portefeuille(mvt.dest_id)
        return Response(MouvementCaisseReadSerializer(mvt).data)

    @extend_schema(summary="Supprimer un mouvement", responses={204: None})
    def delete(self, request, pk):
        mvt = self.get_object(pk)
        source = mvt.source_id if mvt.source_type == 'portefeuille' else None
        dest = mvt.dest_id if mvt.dest_type == 'portefeuille' else None
        mvt.delete()
        if source:
            calculer_solde_portefeuille(source)
        if dest:
            calculer_solde_portefeuille(dest)
        return Response(status=status.HTTP_204_NO_CONTENT)

class TransfertPortefeuilleView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Effectuer un Transfert Banques & Caisses",
        description="Soustrait symétriquement une enveloppe de la caisse X pour l'ajouter à la banque Y sans provoquer d'anomalie d'inventaire.",
        request=dict, responses={201: MouvementCaisseReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        source_id = request.data.get('source_id')
        dest_id = request.data.get('dest_id')
        montant = request.data.get('montant')
        date_mouvement = request.data.get('date_mouvement')
        desc = request.data.get('description', 'Transfert')

        pf_source = get_object_or_404(Portefeuille, pk=source_id)
        pf_dest = get_object_or_404(Portefeuille, pk=dest_id)
        
        with transaction.atomic():
            mvt = MouvementCaisse.objects.create(organisation=request.user.organisation, 
                source_type='portefeuille', source_id=pf_source,
                dest_type='portefeuille', dest_id=pf_dest,
                montant=montant, date_mouvement=date_mouvement,
                nature='transfert_portefeuille', description=desc,
                created_by=request.user
            )
            calculer_solde_portefeuille(pf_source)
            calculer_solde_portefeuille(pf_dest)
        
        return Response(MouvementCaisseReadSerializer(mvt).data, status=status.HTTP_201_CREATED)


class TresorerieConsolideeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Aperçu Trésorerie Sécurisée",
        description="Fait la somme colossale de l'ensemble de l'argent liquide au sein de toutes nos banques et nos caisses des diverses boutiques rattachées.",
        responses={200: dict}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        pfs = Portefeuille.objects.filter(organisation=request.user.organisation)
        if request.user.role == 'gerant':
            pfs = pfs.filter(entite_type='boutique', entite_id=request.user.entite_id)
        elif request.user.role == 'pdg':
            pfs = pfs.filter(entite_type='ferme')
            
        # Ensure solde update for all
        for pf in pfs:
            calculer_solde_portefeuille(pf)
            
        data = PortefeuilleReadSerializer(pfs, many=True).data
        total_solde = sum([float(p.solde_actuel) for p in pfs])
        return Response({
            'total_solde': total_solde,
            'portefeuilles': data
        })

class DemandePaiementInterneListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Liste des demandes de paiement internes", responses={200: DemandePaiementInterneReadSerializer(many=True)})
    def get(self, request):
        queryset = DemandePaiementInterne.objects.filter(organisation=request.user.organisation)
        # Filter by role
        if request.user.role == 'gerant':
            # See requests initiated by or sent to their entity
            queryset = queryset.filter(
                Q(initiateur=request.user) | 
                Q(achat__entite_id=request.user.entite_id, achat__entite_type=request.user.entite_type) |
                Q(vente__entite_id=request.user.entite_id, vente__entite_type=request.user.entite_type)
            )
        serializer = DemandePaiementInterneReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(summary="Initier une demande de paiement", request=DemandePaiementInterneWriteSerializer, responses={201: DemandePaiementInterneReadSerializer})
    def post(self, request):
        serializer = DemandePaiementInterneWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(organisation=request.user.organisation, initiateur=request.user, statut='en_attente')
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class DemandePaiementInterneValiderView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Valider/Réceptionner un paiement interne", request=dict, responses={200: dict})
    def post(self, request, pk):
        demande = get_object_or_404(DemandePaiementInterne, pk=pk, organisation=request.user.organisation)
        if demande.statut != 'en_attente':
            return Response({'error': "Cette demande n'est plus en attente."}, status=status.HTTP_400_BAD_REQUEST)
        
        dest_pf_id = request.data.get('dest_portefeuille')
        decision = request.data.get('decision', 'valide') # 'valide' or 'rejete'
        
        if decision == 'rejete':
            demande.statut = 'rejete'
            demande.validateur = request.user
            demande.date_validation = timezone.now()
            demande.save()
            return Response({'status': 'rejete'})

        if not dest_pf_id:
            return Response({'error': "Veuillez choisir un portefeuille de destination."}, status=status.HTTP_400_BAD_REQUEST)

        dest_pf = get_object_or_404(Portefeuille, pk=dest_pf_id, organisation=request.user.organisation)
        
        with transaction.atomic():
            # 1. Update request
            demande.statut = 'valide'
            demande.dest_portefeuille = dest_pf
            demande.validateur = request.user
            demande.date_validation = timezone.now()
            demande.save()

            # 2. Trigger Financial Movement
            mvt = MouvementCaisse.objects.create(
                organisation=request.user.organisation,
                source_type='portefeuille', source_id=demande.source_portefeuille,
                dest_type='portefeuille', dest_id=dest_pf,
                montant=demande.montant,
                nature='transfert_portefeuille',
                date_mouvement=timezone.now().date(),
                description=f"Paiement Interne : {demande.vente.reference}",
                reference_table='ventes',
                reference_id=demande.vente.id,
                created_by=request.user
            )

            # 3. Update related Achat/Vente payment status
            if demande.achat_id:
                type(demande.achat).objects.filter(id=demande.achat_id).update(statut_paiement='paye')
            if demande.vente_id:
                type(demande.vente).objects.filter(id=demande.vente_id).update(statut_paiement='paye')

            # 4. Update Balances
            calculer_solde_portefeuille(demande.source_portefeuille)
            calculer_solde_portefeuille(dest_pf)

        return Response({'status': 'valide', 'mouvement_id': mvt.id})

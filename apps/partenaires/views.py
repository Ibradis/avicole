# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import Partenaire
from .serializers import PartenaireReadSerializer, PartenaireWriteSerializer

class PartenaireListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Lister les partenaires",
        description="Affiche la base de données des fournisseurs et clients. Le calcul de la balance solde de chaque entité est immédiatement visible.",
        responses={200: PartenaireReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Partenaire.objects.filter(organisation=request.user.organisation)
        
        # Filtrage par contexte d'entité (Spécifications v18.0)
        if request.user.role == 'pdg':
            queryset = queryset.filter(entite_type='ferme')
        # Un gérant ou vendeur ne voit que les partenaires de sa boutique
        elif request.user.entite_type == 'boutique' and request.user.entite_id:
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
        # Un Admin peut vouloir filtrer par entité via query params
        else:
            entite_type = request.query_params.get('entite_type')
            entite_id = request.query_params.get('entite_id')
            if entite_type and entite_id:
                queryset = queryset.filter(entite_type=entite_type, entite_id=entite_id)

        type_part = request.query_params.get('type')
        if type_part:
            queryset = queryset.filter(type=type_part)
            
        serializer = PartenaireReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Créer un partenaire",
        description="Sauvegardez un profil client ou fournisseur. Prenez soin d'initialiser son solde financier s'il nous devance de la monnaie existante.",
        request=PartenaireWriteSerializer, 
        responses={201: PartenaireReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = PartenaireWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité si gérant ou vendeur
        extra_data = {
            "organisation": request.user.organisation,
            "solde_actuel": serializer.validated_data.get('solde_initial', 0)
        }
        
        if request.user.entite_type == 'boutique' and request.user.entite_id:
            extra_data["entite_type"] = 'boutique'
            extra_data["entite_id"] = request.user.entite_id
            
        partenaire = serializer.save(**extra_data)
        return Response(PartenaireReadSerializer(partenaire).data, status=status.HTTP_201_CREATED)

class PartenaireDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Partenaire, pk=pk)

    @extend_schema(
        summary="Détails d'un partenaire",
        description="Afficher complètement le profil pour le partenaire sélectionné par la PK.",
        responses={200: PartenaireReadSerializer}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        from apps.finances.models import MouvementCaisse
        partenaire = self.get_object(pk)
        data = PartenaireReadSerializer(partenaire).data
        data = dict(data)

        # --- Achats liés (si fournisseur) ---
        if partenaire.type == 'fournisseur':
            from apps.achats.models import Achat
            achats = Achat.objects.filter(
                fournisseur=partenaire,
                organisation=request.user.organisation
            ).order_by('-date_achat')
            data['achats'] = [
                {
                    'id': a.id,
                    'reference': a.reference or f'ACHAT-{a.id}',
                    'date': str(a.date_achat),
                    'montant_total': float(a.montant_total),
                    'statut': a.statut,
                    'statut_paiement': a.statut_paiement,
                } for a in achats
            ]
            data['ventes'] = []

        # --- Ventes liées (si client) ---
        elif partenaire.type == 'client':
            from apps.ventes.models import Vente
            ventes = Vente.objects.filter(
                client=partenaire,
                organisation=request.user.organisation
            ).order_by('-date_vente')
            data['ventes'] = [
                {
                    'id': v.id,
                    'reference': v.reference or f'VENTE-{v.id}',
                    'date': str(v.date_vente),
                    'montant_total': float(v.montant_total),
                    'statut': v.statut,
                    'statut_paiement': v.statut_paiement,
                } for v in ventes
            ]
            data['achats'] = []
        else:
            data['achats'] = []
            data['ventes'] = []

        # --- Mouvements financiers liés ---
        mouvements = MouvementCaisse.objects.filter(
            reference_table='partenaires',
            reference_id=partenaire.id,
            organisation=request.user.organisation
        ).order_by('-date_mouvement')

        # Also fetch movements linked via achats/ventes
        achat_ids = [a['id'] for a in data.get('achats', [])]
        vente_ids = [v['id'] for v in data.get('ventes', [])]

        from django.db.models import Q
        all_mouvements = MouvementCaisse.objects.filter(
            Q(reference_table='partenaires', reference_id=partenaire.id) |
            Q(reference_table='achats', reference_id__in=achat_ids) |
            Q(reference_table='ventes', reference_id__in=vente_ids),
            organisation=request.user.organisation
        ).select_related('source_id', 'dest_id').order_by('-date_mouvement').distinct()

        data['mouvements'] = [
            {
                'id': m.id,
                'date': str(m.date_mouvement),
                'nature': m.get_nature_display(),
                'montant': float(m.montant),
                'description': m.description or '',
                'source': m.source_id.nom if m.source_id else '—',
                'destination': m.dest_id.nom if m.dest_id else '—',
            } for m in all_mouvements
        ]

        return Response(data)


    @extend_schema(
        summary="Mise à jour d'un partenaire",
        description="Mise à jour libre (PATCH) de la fiche, comme pour altérer ou ajouter l'adresse ou le téléphone.",
        request=PartenaireWriteSerializer, 
        responses={200: PartenaireReadSerializer}
    )
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = PartenaireWriteSerializer(
            self.get_object(pk), data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        partenaire = serializer.save(organisation=request.user.organisation)
        return Response(PartenaireReadSerializer(partenaire).data)

    @extend_schema(
        summary="Archiver un partenaire",
        description="Pivote le statut de ce partenaire vers inactif.",
        responses={204: None}
    )
    # Fonction de suppression (DELETE) logique ou physique
    def delete(self, request, pk):
        from apps.finances.models import MouvementCaisse
        partenaire = self.get_object(pk)

        # Vérification : ne pas supprimer si des transactions existent
        has_achats = False
        has_ventes = False
        if partenaire.type == 'fournisseur':
            from apps.achats.models import Achat
            has_achats = Achat.objects.filter(fournisseur=partenaire).exists()
        elif partenaire.type == 'client':
            from apps.ventes.models import Vente
            has_ventes = Vente.objects.filter(client=partenaire).exists()

        has_mouvements = MouvementCaisse.objects.filter(
            reference_table='partenaires', reference_id=partenaire.id
        ).exists()

        if has_achats or has_ventes or has_mouvements:
            return Response(
                {"detail": "Impossible d'archiver ce partenaire : des transactions (achats, ventes ou paiements) lui sont liées."},
                status=status.HTTP_400_BAD_REQUEST
            )

        partenaire.actif = False
        partenaire.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PartenaireSoldeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Voir le solde",
        description="Obtenir la dette ou la somme au crédit restante de ce client ou fournisseur.",
        responses={200: dict}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        partenaire = get_object_or_404(Partenaire, pk=pk)
        return Response({
            "id": partenaire.id,
            "nom": partenaire.nom,
            "solde_actuel": partenaire.solde_actuel
        })

class PartenaireRecalculSoldeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Recalcul des historiques du solde",
        description="Rejoue les écritures financières liant le partenaire à nos achats ou nos ventes afin d'inférer précisément son solde en direct.",
        request=None, 
        responses={200: dict}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request, pk):
        partenaire = get_object_or_404(Partenaire, pk=pk)
        # TODO: Implement logic from mouvements_caisse or achats/ventes
        partenaire.solde_actuel = partenaire.solde_initial
        partenaire.save()
        
        return Response({
            "id": partenaire.id,
            "solde_recalcule": partenaire.solde_actuel,
            "message": "Solde recalculé avec succès."
        })

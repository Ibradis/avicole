# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from .models import Ferme, Lot, ProductionOeuf, RapportJournalier
from .serializers import (
    FermeReadSerializer, FermeWriteSerializer,
    LotReadSerializer, LotWriteSerializer,
    ProductionOeufReadSerializer, ProductionOeufWriteSerializer,
    RapportJournalierReadSerializer, RapportJournalierWriteSerializer
)

class FermeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_ferme(self, request):
        if request.user.entite_type == 'ferme' and request.user.entite_id:
            return get_object_or_404(Ferme, pk=request.user.entite_id, organisation=request.user.organisation)
        return get_object_or_404(Ferme, organisation=request.user.organisation)

    @extend_schema(
        summary="Détails de la Ferme",
        description="Consulter les informations générales de la ferme (nom, logo, contact) liée à l'utilisateur.",
        responses={200: FermeReadSerializer}
    )
    def get(self, request):
        serializer = FermeReadSerializer(self.get_ferme(request))
        return Response(serializer.data)

    @extend_schema(
        summary="Mise à jour de la Ferme",
        description="Modifier les métadonnées de l'exploitation (adresse, téléphone, logo).",
        request=FermeWriteSerializer,
        responses={200: FermeReadSerializer}
    )
    def patch(self, request):
        ferme = self.get_ferme(request)
        serializer = FermeWriteSerializer(ferme, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(FermeReadSerializer(ferme).data)

class LotListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Gestion des Lots",
        description="Lister et filtrer tous les lots de volaille, actifs ou inactifs, présents sur la ferme.",
        responses={200: LotReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = Lot.objects.filter(organisation=request.user.organisation)
        serializer = LotReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Initier un Lot",
        description="Création d'un nouveau lot physique arrivant dans les bâtiments de l'exploitation.",
        request=LotWriteSerializer, 
        responses={201: LotReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = LotWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité ferme
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        lot = serializer.save(**extra_data)
        return Response(LotReadSerializer(lot).data, status=status.HTTP_201_CREATED)

class LotDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Lot, pk=pk)

    @extend_schema(
        summary="Inspection d'un Lot",
        description="Voir tous les métadonnées (quantité initiale/actuelle, souche, provenance) liées à un lot unique.",
        responses={200: LotReadSerializer}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        lot = self.get_object(pk)
        data = LotReadSerializer(lot).data
        data = dict(data)

        # --- Productions ---
        productions = ProductionOeuf.objects.filter(lot=lot).select_related('rapport').order_by('-rapport__date_rapport')
        data['productions'] = [
            {
                'id': p.id,
                'date': str(p.rapport.date_rapport),
                'plateaux': float(p.quantite_plateaux),
                'unites': p.quantite_unites,
                'casses': p.oeufs_casses,
            } for p in productions
        ]

        # --- Mortalités ---
        from apps.sante.models import Mortalite, Vaccination, Traitement
        mortalites = Mortalite.objects.filter(lot=lot).order_by('-date')
        total_morts = sum(m.quantite for m in mortalites)
        data['mortalites'] = [
            {
                'id': m.id,
                'date': str(m.date),
                'quantite': m.quantite,
                'cause': m.cause,
            } for m in mortalites
        ]
        data['total_morts'] = total_morts
        data['taux_mortalite'] = round((total_morts / lot.quantite_initiale * 100), 2) if lot.quantite_initiale > 0 else 0

        # --- Santé (Vaccins) ---
        vaccinations = Vaccination.objects.filter(lot=lot).select_related('produit').order_by('-date_vaccination')
        data['vaccinations'] = [
            {
                'id': v.id,
                'date': str(v.date_vaccination),
                'produit': v.produit.nom,
                'methode': v.methode_administration,
            } for v in vaccinations
        ]

        # --- Santé (Traitements) ---
        traitements = Traitement.objects.filter(lot=lot).select_related('produit').order_by('-date_debut')
        data['traitements'] = [
            {
                'id': t.id,
                'date_debut': str(t.date_debut),
                'date_fin': str(t.date_fin) if t.date_fin else None,
                'produit': t.produit.nom,
                'posologie': t.posologie,
            } for t in traitements
        ]

        # --- Alimentation ---
        from apps.alimentation.models import Consommation
        consos = Consommation.objects.filter(lot=lot).select_related('produit').order_by('-date_consommation')
        data['consommations'] = [
            {
                'id': c.id,
                'date': str(c.date_consommation),
                'produit': c.produit.nom,
                'quantite': float(c.quantite),
            } for c in consos
        ]

        # --- Âge (Calculé) ---
        from datetime import date as dt_date
        today = dt_date.today()
        delta = today - lot.date_arrivee
        data['age_jours'] = delta.days
        data['age_semaines'] = delta.days // 7

        return Response(data)


    @extend_schema(
        summary="Modifier un Lot",
        description="Actualiser les informations administratives d'un Lot.",
        request=LotWriteSerializer, 
        responses={200: LotReadSerializer}
    )
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = LotWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        lot = serializer.save(organisation=request.user.organisation)
        return Response(LotReadSerializer(lot).data)

    @extend_schema(summary="Supprimer un Lot", responses={204: None})
    def delete(self, request, pk):
        lot = self.get_object(pk)
        lot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ProductionOeufListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Afficher Productions",
        description="Visualiser la liste des relevés quotidiens de pondoirs (Production d'Oueufs) par lot.",
        responses={200: ProductionOeufReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = ProductionOeuf.objects.filter(organisation=request.user.organisation)
        serializer = ProductionOeufReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Saisir Production",
        description="Enregistrer localement de la nouvelle ponte issue d'une ramasse journalière.",
        request=ProductionOeufWriteSerializer, 
        responses={201: ProductionOeufReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = ProductionOeufWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité ferme
        extra_data = {"organisation": request.user.organisation}
        if request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        production = serializer.save(**extra_data)
        return Response(ProductionOeufReadSerializer(production).data, status=status.HTTP_201_CREATED)

class ProductionOeufDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(ProductionOeuf, pk=pk)

    @extend_schema(
        summary="Détails de PONTE",
        description="Voir précisément le ratio normaux/cassés/double jaune déclarés lors d'une saisie de ponte.",
        responses={200: ProductionOeufReadSerializer}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = ProductionOeufReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(
        summary="Corriger une PONTE",
        description="Modifier le rapport d'une ramasse si on repère une erreur immédiate.",
        request=ProductionOeufWriteSerializer, 
        responses={200: ProductionOeufReadSerializer}
    )
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = ProductionOeufWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        production = serializer.save(organisation=request.user.organisation)
        return Response(ProductionOeufReadSerializer(production).data)

    @extend_schema(summary="Supprimer une production", responses={204: None})
    def delete(self, request, pk):
        production = self.get_object(pk)
        production.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class RapportJournalierListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Afficher les Rapports",
        description="Catalogue exhaustif regroupant tous les rapports clôturés et brouillons par date.",
        responses={200: RapportJournalierReadSerializer(many=True)}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        queryset = RapportJournalier.objects.filter(organisation=request.user.organisation).order_by('-date_rapport')
        serializer = RapportJournalierReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Initier un Rapport Fiche d'Élevage",
        description="Soumettre une fiche journalière (qui restera brouillon jusqu'à validation) par un superviseur autoritairement modifiable.",
        request=RapportJournalierWriteSerializer, 
        responses={201: RapportJournalierReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = RapportJournalierWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-population de l'entité ferme
        extra_data = {
            "organisation": request.user.organisation,
            "redacteur": request.user
        }
        if request.user.entite_type == 'ferme' and request.user.entite_id:
            extra_data["entite_type"] = 'ferme'
            extra_data["entite_id"] = request.user.entite_id
            
        rapport = serializer.save(**extra_data)
        return Response(RapportJournalierReadSerializer(rapport).data, status=status.HTTP_201_CREATED)

class RapportJournalierDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(RapportJournalier, pk=pk)

    @extend_schema(
        summary="Voir fiche rapport",
        description="Consulter l'entièreté d'un rapport quotidien soumis à la base.",
        responses={200: RapportJournalierReadSerializer}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = RapportJournalierReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(
        summary="Ajuster fiche rapport",
        description="Permet à l'employé d'apporter des amendements textuels au brouillon du rapport avant soumission finale.",
        request=RapportJournalierWriteSerializer, 
        responses={200: RapportJournalierReadSerializer}
    )
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        serializer = RapportJournalierWriteSerializer(self.get_object(pk), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        rapport = serializer.save(organisation=request.user.organisation)
        return Response(RapportJournalierReadSerializer(rapport).data)

    @extend_schema(summary="Supprimer un rapport journalier", responses={204: None})
    def delete(self, request, pk):
        rapport = self.get_object(pk)
        rapport.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RapportJournalierValiderView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Validation Dirigeant (Workflow)",
        description="Le superviseur ou gérant passe le statut du rapport en Validé. Cette action impacte directement les bilans d'alertes.",
        request=None,
        responses={200: dict}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request, pk):
        rapport = get_object_or_404(RapportJournalier, pk=pk)
        rapport.statut = 'valide'
        rapport.validateur = request.user
        rapport.save()
        return Response({"detail": "Le rapport est désormais validé et scellé."})

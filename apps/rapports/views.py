# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db.models import Sum, F
from apps.ventes.models import Vente
from apps.achats.models import Achat
from apps.finances.models import Portefeuille, MouvementCaisse
from apps.stocks.models import Stock
from apps.finances.serializers import MouvementCaisseReadSerializer
from apps.stocks.serializers import StockReadSerializer
class TresorerieReportView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Analytics: Situation de Trésorerie", description="Évalue le cash-flow positif ou négatif via l'historique Mouvements_Caisse.", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request): return Response({"titre": "Report Trésorerie", "data": []})

class ProductionReportView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Analytics: Performance du Pondoir/Biologie", description="Estime le taux de ponte par poule sur les divers Lots actifs.", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request): return Response({"titre": "Report Production", "data": []})

class CoutRevientReportView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Analytics: Coût de Revient Unitaire", description="Répartit les charges divisées par la production finie commercialisée.", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request): return Response({"titre": "Coût de Revient", "data": []})

class VentesReportView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Analytics: Rapport du C.A des Ventes", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request): return Response({"titre": "Rapport Ventes", "data": []})

class AchatsReportView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Analytics: Cumul des dépenses directes liées aux achats", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request): return Response({"titre": "Rapport Achats", "data": []})

class ChargesReportView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Analytics: Synthèse sectorielle des charges", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request): return Response({"titre": "Rapport Charges", "data": []})

class CofoReportView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Analytics: Bilan transformation semi-finie COFO", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request): return Response({"titre": "Rapport COFO", "data": []})

class VeterinairesReportView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Analytics: Investissement de Maintient de l'Orgue Biologique (Véts)", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request): return Response({"titre": "Rapport Vétérinaires", "data": []})

class StockReportView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Analytics: Ratio et Valeur d'Approvisionnement", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request): return Response({"titre": "Rapport Stock", "data": []})

class PartenairesSoldesReportView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Analytics: Dette Cumulée ou Prêt Cumulé Aux Tiers", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request): return Response({"titre": "Rapport Soldes Partenaires", "data": []})

class DashboardFermeView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Vue Maquette Tableau de Bord (Global Ferme)", description="Englobe une matrice dimensionnelle multi-KPI pour afficher en vue accueil web.", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request):
        if request.user.role == 'gerant':
            return Response({"error": "Accès refusé au dashboard global."}, status=403)

        # Détermination du filtre d'entité
        # Si Admin -> Voit tout (Ferme + Boutiques)
        # Si PDG, Controleur, Vendeur -> Uniquement Ferme
        is_admin = request.user.role == 'admin'
        entity_filter = {} if is_admin else {'entite_type': 'ferme'}
        
        # Calcul du Chiffre d'Affaires
        total_ventes = Vente.objects.filter(organisation=request.user.organisation, **entity_filter).aggregate(Sum('montant_total'))['montant_total__sum'] or 0
        
        # Calcul du total des achats
        total_achats = Achat.objects.filter(organisation=request.user.organisation, **entity_filter).aggregate(Sum('montant_total'))['montant_total__sum'] or 0
        
        # Synthétisation de la liquidité active
        solde_tresorerie = Portefeuille.objects.filter(organisation=request.user.organisation, **entity_filter).aggregate(Sum('solde_actuel'))['solde_actuel__sum'] or 0
        
        # Alertes stock filtrées
        alertes_stock = Stock.objects.filter(organisation=request.user.organisation, quantite_actuelle__lte=F('seuil_alerte'), **entity_filter)
        alertes_stock_data = StockReadSerializer(alertes_stock, many=True).data

        # Mouvements financiers récents filtrés
        mouvements = MouvementCaisse.objects.filter(
            organisation=request.user.organisation
        )
        if not is_admin:
            mouvements = mouvements.filter(source_id__entite_type='ferme')
            
        mouvements = mouvements.order_by('-date_mouvement', '-created_at')[:10]
        mouvements_data = MouvementCaisseReadSerializer(mouvements, many=True).data

        # Soldes partenaires
        from apps.partenaires.models import Partenaire
        dettes_clients = Partenaire.objects.filter(organisation=request.user.organisation, type='client', **entity_filter).aggregate(Sum('solde_actuel'))['solde_actuel__sum'] or 0
        dettes_fournisseurs = Partenaire.objects.filter(organisation=request.user.organisation, type='fournisseur', **entity_filter).aggregate(Sum('solde_actuel'))['solde_actuel__sum'] or 0

        return Response({
            "dashboard": "Tableau de Bord Ferme" if is_admin else "Tableau de Bord Ferme (Restreint)", 
            "kpis": {
                "total_ventes": total_ventes,
                "total_achats": total_achats,
                "liquidite_totale": solde_tresorerie,
                "dettes_clients_ferme": dettes_clients,
                "dettes_fournisseurs_ferme": dettes_fournisseurs
            },
            "alertes_rupture_stock": alertes_stock_data,
            "mouvements_financiers_recents": mouvements_data
        })

class DashboardBoutiqueView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(summary="Vue Maquette Tableau de Bord (Boutique Unique)", description="Sépare les datas à la localité géographique restreinte de la boutique.", responses={200: dict})
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        # Sécurité v18.0: Force l'ID de la boutique pour le gérant
        if request.user.role == 'gerant':
            if not request.user.entite_id:
                return Response({"error": "Aucune boutique rattachée à votre compte."}, status=403)
            pk = request.user.entite_id

        """
        Cette vue restitue une interface allégée pour les gérants de points de vente de la ferme :
        1. Ventes propres uniquement accomplies dans cette même boutique
        2. Solde existant dans le tiroir caisse propre à l'entité de la boutique
        """
        # Additionne les reçus validés pour l'ID boutique demandé
        total_ventes = Vente.objects.filter(organisation=request.user.organisation, entite_type='boutique', entite_id=pk).aggregate(Sum('montant_total'))['montant_total__sum'] or 0
        
        # Additionne les dépenses d'achats pour cette boutique
        total_achats = Achat.objects.filter(organisation=request.user.organisation, entite_type='boutique', entite_id=pk).aggregate(Sum('montant_total'))['montant_total__sum'] or 0

        # Additionne les soldes des portefeuilles appartenant géographiquement à cette boutique
        solde_boutique = Portefeuille.objects.filter(organisation=request.user.organisation, entite_type='boutique', entite_id=pk).aggregate(Sum('solde_actuel'))['solde_actuel__sum'] or 0
        
        # Calcul des soldes partenaires (Boutique uniquement)
        from apps.partenaires.models import Partenaire
        dettes_clients = Partenaire.objects.filter(organisation=request.user.organisation, entite_type='boutique', entite_id=pk, type='client').aggregate(Sum('solde_actuel'))['solde_actuel__sum'] or 0
        dettes_fournisseurs = Partenaire.objects.filter(organisation=request.user.organisation, entite_type='boutique', entite_id=pk, type='fournisseur').aggregate(Sum('solde_actuel'))['solde_actuel__sum'] or 0

        # Données de la boutique (Mouvements et Stocks)
        alertes_stock = Stock.objects.filter(
            organisation=request.user.organisation, 
            entite_type='boutique', 
            entite_id=pk,
            quantite_actuelle__lte=F('seuil_alerte')
        )
        alertes_stock_data = StockReadSerializer(alertes_stock, many=True).data

        mouvements = MouvementCaisse.objects.filter(
            organisation=request.user.organisation,
            source_id__entite_type='boutique',
            source_id__entite_id=pk
        ).order_by('-date_mouvement', '-created_at')[:10]
        mouvements_data = MouvementCaisseReadSerializer(mouvements, many=True).data

        return Response({
            "dashboard": f"Dashboard Boutique {pk}", 
            "kpis": {
                "chiffre_affaire_boutique": total_ventes,
                "total_achats_boutique": total_achats,
                "liquidite_totale": solde_boutique, # Changé pour compatibilité frontend
                "dettes_clients_ferme": dettes_clients, # Changé pour compatibilité frontend
                "dettes_fournisseurs_boutique": dettes_fournisseurs,
                "total_ventes": total_ventes, # Alias pour compatibilité
            },
            "alertes_rupture_stock": alertes_stock_data,
            "mouvements_financiers_recents": mouvements_data
        })

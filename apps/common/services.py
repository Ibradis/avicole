from decimal import Decimal
from django.db import transaction
from datetime import date
from apps.stocks.models import Stock, MouvementStock
from apps.finances.models import Portefeuille, MouvementCaisse
from apps.partenaires.models import Partenaire

class StockService:
    @staticmethod
    @transaction.atomic
    def adjust_stock(produit, entite_type, entite_id, organisation, delta_quantite, type_mouvement, reference=None, observations=None, date_mouvement=None):
        if date_mouvement is None:
            date_mouvement = date.today()
            
        # 1. Update or create Stock
        stock, created = Stock.objects.get_or_create(
            produit=produit,
            entite_type=entite_type,
            entite_id=entite_id,
            organisation=organisation
        )
        
        if type_mouvement == 'entree':
            stock.quantite_actuelle += Decimal(str(delta_quantite))
        else:
            stock.quantite_actuelle -= Decimal(str(delta_quantite))
        stock.save()
        
        # 2. Log movement
        return MouvementStock.objects.create(
            produit=produit,
            entite_type=entite_type,
            entite_id=entite_id,
            organisation=organisation,
            date_mouvement=date_mouvement,
            type_mouvement=type_mouvement,
            quantite=delta_quantite,
            reference=reference,
            observations=observations
        )

class FinanceService:
    @staticmethod
    @transaction.atomic
    def record_movement(organisation, montant, nature, source_type, source_id=None, dest_type='tiers', dest_id=None, description=None, date_mouvement=None, created_by=None, reference_table=None, reference_id=None):
        if date_mouvement is None:
            date_mouvement = date.today()

        # 1. Update balances
        if source_type == 'portefeuille' and source_id:
            source_id.solde_actuel -= Decimal(str(montant))
            source_id.save()
            
        if dest_type == 'portefeuille' and dest_id:
            dest_id.solde_actuel += Decimal(str(montant))
            dest_id.save()
            
        # 2. Update partner balance
        # If destination is tiers, it means money (or debt) is moving TO them (e.g. Achat, or Payment to them)
        # If source is tiers, it means money (or debt) is moving FROM them (e.g. Vente, or Payment from them)
        
        target_partenaire = None
        if reference_table == 'partenaires' and reference_id:
            try:
                target_partenaire = Partenaire.objects.get(id=reference_id)
            except Partenaire.DoesNotExist:
                pass
        elif reference_table == 'achats' and reference_id:
            from apps.achats.models import Achat
            try:
                achat = Achat.objects.get(id=reference_id)
                target_partenaire = achat.fournisseur
            except: pass
        elif reference_table == 'ventes' and reference_id:
            from apps.ventes.models import Vente
            try:
                vente = Vente.objects.get(id=reference_id)
                target_partenaire = vente.client
            except: pass

        if target_partenaire:
            amt = Decimal(str(montant))
            if target_partenaire.type == 'client':
                # Client: source tiers (vente/créance) -> +, dest portefeuille (paiement) -> -
                if source_type == 'tiers' and dest_type == 'tiers': 
                    target_partenaire.solde_actuel += amt
                elif source_type == 'tiers' and dest_type == 'portefeuille':
                    target_partenaire.solde_actuel -= amt
                elif source_type == 'portefeuille' and dest_type == 'tiers':
                    target_partenaire.solde_actuel += amt
            else: # Fournisseur
                # Fournisseur: dest tiers (achat/dette) -> +, source portefeuille (paiement) -> -
                if source_type == 'tiers' and dest_type == 'tiers':
                    target_partenaire.solde_actuel += amt
                elif source_type == 'portefeuille' and dest_type == 'tiers':
                    target_partenaire.solde_actuel -= amt
                elif source_type == 'tiers' and dest_type == 'portefeuille':
                    target_partenaire.solde_actuel -= amt
            
            target_partenaire.save()

        # 3. Log movement
        return MouvementCaisse.objects.create(
            organisation=organisation,
            montant=montant,
            nature=nature,
            source_type=source_type,
            source_id=source_id,
            dest_type=dest_type,
            dest_id=dest_id,
            description=description,
            date_mouvement=date_mouvement,
            created_by=created_by,
            reference_table=reference_table,
            reference_id=reference_id
        )

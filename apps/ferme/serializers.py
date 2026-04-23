from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Ferme, Lot, RapportJournalier, ProductionOeuf

class FermeReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ferme
        fields = '__all__'

class FermeWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ferme
        fields = ['nom', 'adresse', 'telephone', 'email', 'logo', 'actif']

class LotReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Lot
        fields = '__all__'

class LotWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Lot
        fields = '__all__'
        read_only_fields = ['quantite_actuelle']

    def create(self, validated_data):
        # Initialisation automatique de la quantité actuelle au démarrage
        validated_data['quantite_actuelle'] = validated_data.get('quantite_initiale', 0)
        return super().create(validated_data)

class RapportJournalierReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    display_label = serializers.SerializerMethodField()

    class Meta:
        model = RapportJournalier
        fields = '__all__'

    def get_display_label(self, obj):
        return f"Rapport du {obj.date_rapport} ({obj.get_statut_display()})"

class RapportJournalierWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = RapportJournalier
        fields = '__all__'
        read_only_fields = ['statut', 'validateur']

class ProductionOeufReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    lot_code = serializers.CharField(source='lot.code', read_only=True)

    class Meta:
        model = ProductionOeuf
        fields = '__all__'

class ProductionOeufWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = ProductionOeuf
        fields = '__all__'

    def create(self, validated_data):
        from apps.common.services import StockService
        from apps.produits.models import Produit
        instance = super().create(validated_data)
        
        # Trouver le produit de type 'oeuf' pour cette organisation
        # On assume qu'il y a un produit générique 'Oeuf'
        produit_oeuf = Produit.objects.filter(organisation=instance.organisation, type='oeuf').first()
        if produit_oeuf:
            # On stocke les unités (nombre d'oeufs)
            bons_oeufs = instance.quantite_unites - instance.oeufs_casses
            if bons_oeufs > 0:
                StockService.adjust_stock(
                    produit=produit_oeuf,
                    entite_type=instance.entite_type,
                    entite_id=instance.entite_id,
                    organisation=instance.organisation,
                    delta_quantite=bons_oeufs,
                    type_mouvement='entree',
                    reference=f"PROD-{instance.id}",
                    observations=f"Production du lot {instance.lot.code}"
                )
        return instance

from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Consommation

class ConsommationReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    lot_code = serializers.CharField(source='lot.code', read_only=True)
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)

    class Meta:
        model = Consommation
        fields = '__all__'

class ConsommationWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Consommation
        fields = '__all__'

    def create(self, validated_data):
        from apps.common.services import StockService
        instance = super().create(validated_data)
        
        # Ajustement du stock (sortie d'aliment)
        StockService.adjust_stock(
            produit=instance.produit,
            entite_type=instance.entite_type,
            entite_id=instance.entite_id,
            organisation=instance.organisation,
            delta_quantite=instance.quantite,
            type_mouvement='sortie',
            reference=f"CONSO-{instance.id}",
            observations=f"Consommation par lot {instance.lot.code}"
        )
        return instance

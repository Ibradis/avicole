from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Vaccination, Traitement, Mortalite

class VaccinationReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    lot_code = serializers.CharField(source='lot.code', read_only=True)
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)

    class Meta:
        model = Vaccination
        fields = '__all__'

class VaccinationWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Vaccination
        fields = '__all__'

    def create(self, validated_data):
        from apps.common.services import StockService
        instance = super().create(validated_data)
        if instance.quantite > 0:
            StockService.adjust_stock(
                produit=instance.produit,
                entite_type=instance.entite_type,
                entite_id=instance.entite_id,
                organisation=instance.organisation,
                delta_quantite=instance.quantite,
                type_mouvement='sortie',
                reference=f"VACC-{instance.id}",
                observations=f"Vaccination lot {instance.lot.code}"
            )
        return instance

class TraitementReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    lot_code = serializers.CharField(source='lot.code', read_only=True)
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)

    class Meta:
        model = Traitement
        fields = '__all__'

class TraitementWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Traitement
        fields = '__all__'

    def create(self, validated_data):
        from apps.common.services import StockService
        instance = super().create(validated_data)
        if instance.quantite > 0:
            StockService.adjust_stock(
                produit=instance.produit,
                entite_type=instance.entite_type,
                entite_id=instance.entite_id,
                organisation=instance.organisation,
                delta_quantite=instance.quantite,
                type_mouvement='sortie',
                reference=f"TRAIT-{instance.id}",
                observations=f"Traitement lot {instance.lot.code}"
            )
        return instance

class MortaliteReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    lot_code = serializers.CharField(source='lot.code', read_only=True)

    class Meta:
        model = Mortalite
        fields = '__all__'

class MortaliteWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Mortalite
        fields = '__all__'

    def create(self, validated_data):
        mortalite = super().create(validated_data)
        lot = mortalite.lot
        lot.quantite_actuelle -= mortalite.quantite
        lot.save()
        return mortalite

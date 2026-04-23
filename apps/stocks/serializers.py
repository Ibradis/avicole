from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Stock, MouvementStock

class StockReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    unite = serializers.CharField(source='produit.unite', read_only=True)

    class Meta:
        model = Stock
        fields = '__all__'

class StockWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'
        read_only_fields = ['quantite_actuelle']

class MouvementStockReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    unite = serializers.CharField(source='produit.unite', read_only=True)

    class Meta:
        model = MouvementStock
        fields = '__all__'

class MouvementStockWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = MouvementStock
        fields = '__all__'

    def create(self, validated_data):
        mvt = super().create(validated_data)
        stock, _ = Stock.objects.get_or_create(produit=mvt.produit)
        if mvt.type_mouvement == 'entree':
            stock.quantite_actuelle += mvt.quantite
        else:
            stock.quantite_actuelle -= mvt.quantite
        stock.save()
        return mvt

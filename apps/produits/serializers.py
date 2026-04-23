from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Produit

class ProduitReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Produit
        fields = '__all__'

class ProduitWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Produit
        fields = '__all__'

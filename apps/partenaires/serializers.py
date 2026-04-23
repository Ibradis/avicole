from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Partenaire

class PartenaireReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Partenaire
        fields = '__all__'

class PartenaireWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Partenaire
        fields = '__all__'
        read_only_fields = ['solde_actuel']

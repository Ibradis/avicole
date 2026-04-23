from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import TypeCharge

class TypeChargeReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = TypeCharge
        fields = '__all__'

class TypeChargeWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = TypeCharge
        fields = '__all__'

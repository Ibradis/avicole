from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import CofoOperation

class CofoOperationReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = CofoOperation
        fields = '__all__'

class CofoOperationWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = CofoOperation
        fields = '__all__'

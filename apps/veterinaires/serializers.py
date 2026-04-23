from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Veterinaire, Contrat, Intervention

class VeterinaireReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Veterinaire
        fields = '__all__'

class VeterinaireWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Veterinaire
        fields = '__all__'

class ContratReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    veterinaire_nom = serializers.CharField(source='veterinaire.nom', read_only=True)

    class Meta:
        model = Contrat
        fields = '__all__'

class ContratWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Contrat
        fields = '__all__'

class InterventionReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    veterinaire_nom = serializers.CharField(source='veterinaire.nom', read_only=True)
    lot_code = serializers.CharField(source='lot.code', read_only=True)

    class Meta:
        model = Intervention
        fields = '__all__'

class InterventionWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Intervention
        fields = '__all__'

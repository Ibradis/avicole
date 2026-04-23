from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Boutique

class BoutiqueReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    solde_caisse = serializers.SerializerMethodField()

    class Meta:
        model = Boutique
        fields = '__all__'

    def get_solde_caisse(self, obj):
        from apps.finances.models import Portefeuille
        from django.db.models import Sum
        total = Portefeuille.objects.filter(
            organisation=obj.organisation,
            entite_type='boutique',
            entite_id=obj.id
        ).aggregate(Sum('solde_actuel'))['solde_actuel__sum'] or 0
        return float(total)

class BoutiqueWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Boutique
        fields = '__all__'

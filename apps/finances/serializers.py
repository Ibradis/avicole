from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Portefeuille, MouvementCaisse, DemandePaiementInterne

class PortefeuilleReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    entite_nom = serializers.SerializerMethodField()

    class Meta:
        model = Portefeuille
        fields = '__all__'

    def get_entite_nom(self, obj):
        if obj.entite_type == 'boutique' and obj.entite_id:
            from apps.boutiques.models import Boutique
            try:
                return Boutique.objects.get(id=obj.entite_id).nom
            except Boutique.DoesNotExist:
                return f"Boutique #{obj.entite_id}"
        elif obj.entite_type == 'ferme':
            return "Ferme"
        return "Organisation"

class PortefeuilleWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Portefeuille
        fields = '__all__'
        read_only_fields = ['solde_actuel']

class MouvementCaisseReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = MouvementCaisse
        fields = '__all__'

class MouvementCaisseWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = MouvementCaisse
        fields = '__all__'

class DemandePaiementInterneReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    initiateur_nom = serializers.CharField(source='initiateur.get_full_name', read_only=True)
    validateur_nom = serializers.CharField(source='validateur.get_full_name', read_only=True)
    source_nom = serializers.CharField(source='source_portefeuille.nom', read_only=True)
    dest_nom = serializers.CharField(source='dest_portefeuille.nom', read_only=True)
    vente_ref = serializers.CharField(source='vente.reference', read_only=True)

    class Meta:
        model = DemandePaiementInterne
        fields = '__all__'

class DemandePaiementInterneWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = DemandePaiementInterne
        fields = '__all__'
        read_only_fields = ['initiateur', 'validateur', 'date_demande', 'date_validation', 'statut', 'dest_portefeuille']

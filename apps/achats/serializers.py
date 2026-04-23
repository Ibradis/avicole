from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Achat, LigneAchat

class LigneAchatSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)

    class Meta:
        model = LigneAchat
        fields = '__all__'
        read_only_fields = ['achat', 'sous_total']
class AchatReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    lignes = LigneAchatSerializer(many=True, read_only=True)
    lignes_data = serializers.SerializerMethodField()
    fournisseur_nom = serializers.SerializerMethodField()
    has_pending_paiement = serializers.SerializerMethodField()

    class Meta:
        model = Achat
        fields = '__all__'

    def get_fournisseur_nom(self, obj):
        if obj.vente_fournisseuse:
            return "LA FERME (Interne)"
        return obj.fournisseur.nom if obj.fournisseur else "Fournisseur inconnu"

    def get_lignes_data(self, obj):
        return [
            {
                "id": ligne.id,
                "produit_id": ligne.produit_id,
                "produit_nom": ligne.produit.nom,
                "quantite": float(ligne.quantite),
                "prix_unitaire": float(ligne.prix_unitaire),
                "sous_total": float(ligne.sous_total)
            } for ligne in obj.lignes.all()
        ]

    def get_has_pending_paiement(self, obj):
        from apps.finances.models import DemandePaiementInterne
        return DemandePaiementInterne.objects.filter(achat=obj, statut='en_attente').exists()

class AchatWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    lignes_data = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )

    class Meta:
        model = Achat
        fields = '__all__'
        read_only_fields = ['montant_total', 'statut', 'statut_paiement']

    def validate(self, data):
        # Prevent modification if already validated
        if self.instance and self.instance.statut == 'valide':
            raise serializers.ValidationError("Impossible de modifier un achat déjà validé.")
        return data

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes_data', [])
        achat = super().create(validated_data)
        self._save_lignes(achat, lignes_data)
        return achat

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes_data', None)
        achat = super().update(instance, validated_data)
        if lignes_data is not None:
            # Simple full replace strategy for now
            achat.lignes.all().delete()
            self._save_lignes(achat, lignes_data)
        return achat

    def _save_lignes(self, achat, lignes_data):
        total = 0
        for ligne in lignes_data:
            quantite = ligne.get('quantite')
            prix = ligne.get('prix_unitaire')
            produit_id = ligne.get('produit_id')
            LigneAchat.objects.create(achat=achat, produit_id=produit_id, quantite=quantite, prix_unitaire=prix)
            total += quantite * prix
        
        achat.montant_total = total
        achat.save()

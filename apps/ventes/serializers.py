from rest_framework import serializers
from apps.common.serializer_mixins import AvicoleValidationMixin
from .models import Vente, LigneVente

class LigneVenteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)

    class Meta:
        model = LigneVente
        fields = '__all__'
        read_only_fields = ['vente', 'sous_total']

class VenteReadSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    lignes = LigneVenteSerializer(many=True, read_only=True)
    lignes_data = serializers.SerializerMethodField()
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    boutique_nom = serializers.CharField(source='boutique_dest.nom', read_only=True)
    destinataire_nom = serializers.SerializerMethodField()

    class Meta:
        model = Vente
        fields = '__all__'

    def get_destinataire_nom(self, obj):
        if obj.boutique_dest:
            return f"Boutique: {obj.boutique_dest.nom}"
        return obj.client.nom if obj.client else "Client inconnu"

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

class VenteWriteSerializer(AvicoleValidationMixin, serializers.ModelSerializer):
    lignes_data = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )

    class Meta:
        model = Vente
        fields = '__all__'
        read_only_fields = ['montant_total', 'statut', 'statut_paiement']

    def validate(self, data):
        # Prevent modification if already validated
        if self.instance and self.instance.statut == 'valide':
            raise serializers.ValidationError("Impossible de modifier une vente déjà validée.")
        return data

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes_data', [])
        vente = super().create(validated_data)
        self._save_lignes(vente, lignes_data)
        return vente

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes_data', None)
        vente = super().update(instance, validated_data)
        if lignes_data is not None:
            # Simple full replace strategy
            vente.lignes.all().delete()
            self._save_lignes(vente, lignes_data)
        return vente

    def _save_lignes(self, vente, lignes_data):
        total = 0
        for ligne in lignes_data:
            quantite = ligne.get('quantite')
            prix = ligne.get('prix_unitaire')
            produit_id = ligne.get('produit_id')
            LigneVente.objects.create(vente=vente, produit_id=produit_id, quantite=quantite, prix_unitaire=prix)
            total += quantite * prix
        
        vente.montant_total = total
        vente.save()

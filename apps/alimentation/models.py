from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class Consommation(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='consommations', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    lot = models.ForeignKey('ferme.Lot', on_delete=models.CASCADE, related_name='consommations')
    produit = models.ForeignKey('produits.Produit', on_delete=models.RESTRICT, related_name='+')
    date_consommation = models.DateField()
    quantite = models.DecimalField(max_digits=10, decimal_places=2)
    observations = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conso {self.produit.nom} - Lot {self.lot.code} le {self.date_consommation}"

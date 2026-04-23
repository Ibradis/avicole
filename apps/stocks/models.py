from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class Stock(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='stocks', null=True, blank=True)
    produit = models.ForeignKey('produits.Produit', on_delete=models.CASCADE, related_name='stocks')
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    quantite_actuelle = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    seuil_alerte = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('produit', 'entite_type', 'entite_id')

    def __str__(self):
        return f"Stock de {self.produit.nom} - {self.quantite_actuelle}"

# Définition de la table en base de données
class MouvementStock(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='mouvements_stock', null=True, blank=True)
    TYPE_MOUVEMENT_CHOICES = (
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
    )

    produit = models.ForeignKey('produits.Produit', on_delete=models.CASCADE, related_name='mouvements_stock')
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    date_mouvement = models.DateField()
    type_mouvement = models.CharField(max_length=20, choices=TYPE_MOUVEMENT_CHOICES)
    quantite = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=150, blank=True, null=True)
    observations = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_mouvement_display()} de {self.quantite} {self.produit.nom}"

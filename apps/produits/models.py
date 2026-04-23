from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class Produit(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='%(class)ss', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    TYPE_PRODUIT_CHOICES = (
        ('oeuf', 'Oeuf'),
        ('aliment', 'Aliment'),
        ('vaccin', 'Vaccin'),
        ('materiel', 'Matériel'),
        ('autre', 'Autre'),
    )

    nom = models.CharField(max_length=150)
    type = models.CharField(max_length=50, choices=TYPE_PRODUIT_CHOICES)
    unite = models.CharField(max_length=20, default='unité', help_text="Unité de mesure (ex: kg, sac, boîte)")
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    actif = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nom} ({self.get_type_display()})"

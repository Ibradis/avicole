from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class Partenaire(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='partenaires', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True) # ID de la ferme ou boutique
    TYPE_CHOICES = (
        ('client', 'Client'),
        ('fournisseur', 'Fournisseur'),
    )

    nom = models.CharField(max_length=150)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    telephone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    
    solde_initial = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    solde_actuel = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nom} ({self.get_type_display()})"

from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class Boutique(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='boutiques', null=True, blank=True)
    ferme = models.ForeignKey('ferme.Ferme', on_delete=models.CASCADE, related_name='%(class)ss_ferme', null=True, blank=True)
    nom = models.CharField(max_length=150)
    responsable = models.CharField(max_length=150, blank=True, null=True)
    statut = models.CharField(max_length=20, choices=(('actif', 'Actif'), ('inactif', 'Inactif')), default='actif')
    adresse = models.TextField(blank=True, null=True)
    telephone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom

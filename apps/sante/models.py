from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class Vaccination(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='vaccinations', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    lot = models.ForeignKey('ferme.Lot', on_delete=models.CASCADE, related_name='vaccinations')
    produit = models.ForeignKey('produits.Produit', on_delete=models.RESTRICT, related_name='+')
    date_vaccination = models.DateField()
    quantite = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    methode_administration = models.CharField(max_length=150, blank=True, null=True)
    intervenant = models.ForeignKey('utilisateurs.Utilisateur', on_delete=models.SET_NULL, null=True, blank=True)
    observations = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Vaccin {self.produit.nom} - Lot {self.lot.code} le {self.date_vaccination}"

# Définition de la table en base de données
class Traitement(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='traitements', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    lot = models.ForeignKey('ferme.Lot', on_delete=models.CASCADE, related_name='traitements')
    produit = models.ForeignKey('produits.Produit', on_delete=models.RESTRICT, related_name='+')
    date_debut = models.DateField()
    date_fin = models.DateField(blank=True, null=True)
    quantite = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    posologie = models.CharField(max_length=200, blank=True, null=True)
    observations = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Traitement {self.produit.nom} - Lot {self.lot.code}"

# Définition de la table en base de données
class Mortalite(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='mortalites', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    lot = models.ForeignKey('ferme.Lot', on_delete=models.CASCADE, related_name='mortalites')
    date = models.DateField()
    quantite = models.PositiveIntegerField()
    cause = models.CharField(max_length=200, blank=True, null=True)
    observations = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Mortalité Lot {self.lot.code} - {self.quantite} le {self.date}"

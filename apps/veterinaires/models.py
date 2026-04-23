from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class Veterinaire(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='%(class)ss', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    nom = models.CharField(max_length=150)
    telephone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    specialite = models.CharField(max_length=150, blank=True, null=True)
    
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom

# Définition de la table en base de données
class Contrat(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='contrats_veterinaires', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    veterinaire = models.ForeignKey(Veterinaire, on_delete=models.CASCADE, related_name='contrats')
    date_debut = models.DateField()
    date_fin = models.DateField(blank=True, null=True)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    actif = models.BooleanField(default=True)
    observations = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Contrat de {self.veterinaire.nom}"

# Définition de la table en base de données
class Intervention(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='interventions_veterinaires', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    veterinaire = models.ForeignKey(Veterinaire, on_delete=models.CASCADE, related_name='interventions')
    lot = models.ForeignKey('ferme.Lot', on_delete=models.SET_NULL, null=True, blank=True)
    date_intervention = models.DateField()
    motif = models.CharField(max_length=200)
    montant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    observations = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Intervention {self.veterinaire.nom} - {self.date_intervention}"

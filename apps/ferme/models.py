from apps.common.models import TenantManager

from django.db import models

# Modèle central d'isolation SaaS multi-locataire
class Ferme(models.Model):
    objects = TenantManager()
    organisation = models.OneToOneField('organisations.Organisation', on_delete=models.CASCADE, related_name='ferme', null=True, blank=True)
    nom = models.CharField(max_length=150)
    superficie = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    telephone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    logo = models.ImageField(upload_to='fermes/logos/', blank=True, null=True)
    actif = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom

# Définition de la table en base de données
class Lot(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='lots', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    code = models.CharField(max_length=50, unique=True)
    date_arrivee = models.DateField()
    quantite_initiale = models.IntegerField()
    quantite_actuelle = models.IntegerField(default=0)
    souche = models.CharField(max_length=100, blank=True, null=True)
    origine = models.CharField(max_length=100, blank=True, null=True)
    actif = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.quantite_actuelle} têtes"

# Définition de la table en base de données
class RapportJournalier(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='rapports_journaliers', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    STATUT_CHOICES = (
        ('brouillon', 'Brouillon'),
        ('soumis', 'Soumis'),
        ('valide', 'Validé'),
    )

    date_rapport = models.DateField()
    redacteur = models.ForeignKey('utilisateurs.Utilisateur', on_delete=models.SET_NULL, null=True, related_name='rapports_rediges')
    validateur = models.ForeignKey('utilisateurs.Utilisateur', on_delete=models.SET_NULL, null=True, blank=True, related_name='rapports_valides')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    observations = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rapport du {self.date_rapport} - {self.get_statut_display()}"

# Définition de la table en base de données
class ProductionOeuf(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='productions_oeufs', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    lot = models.ForeignKey(Lot, on_delete=models.CASCADE, related_name='%(class)ss_lot', null=True, blank=True)
    rapport = models.ForeignKey(RapportJournalier, on_delete=models.CASCADE, related_name='productions')
    quantite_plateaux = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantite_unites = models.IntegerField(default=0)
    oeufs_casses = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Production {self.lot.code} - {self.rapport.date_rapport}"

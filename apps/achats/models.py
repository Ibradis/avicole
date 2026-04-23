from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class Achat(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='achats', null=True, blank=True)
    STATUT_PAYEMENT_CHOICES = (
        ('en_attente', 'En attente'),
        ('partiel', 'Partiel'),
        ('paye', 'Payé'),
    )
    
    STATUT_CHOICES = (
        ('brouillon', 'Brouillon'),
        ('valide', 'Validé (Réceptionné)'),
        ('annule', 'Annulé'),
    )

    fournisseur = models.ForeignKey('partenaires.Partenaire', on_delete=models.RESTRICT, related_name='achats', null=True, blank=True)
    vente_fournisseuse = models.OneToOneField('ventes.Vente', on_delete=models.SET_NULL, null=True, blank=True, related_name='achat_miroir')
    date_achat = models.DateField()
    date_reception = models.DateField(null=True, blank=True)
    reference = models.CharField(max_length=150, blank=True, null=True)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    statut_paiement = models.CharField(max_length=20, choices=STATUT_PAYEMENT_CHOICES, default='en_attente')
    observations = models.TextField(blank=True, null=True)

    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    
    portefeuille = models.ForeignKey('finances.Portefeuille', on_delete=models.SET_NULL, null=True, blank=True, related_name='achats')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Achat {self.id} du {self.date_achat} ({self.fournisseur.nom})"

class LigneAchat(models.Model):
    achat = models.ForeignKey(Achat, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey('produits.Produit', on_delete=models.RESTRICT)
    quantite = models.DecimalField(max_digits=10, decimal_places=2)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    sous_total = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.sous_total = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantite} x {self.produit.nom}"

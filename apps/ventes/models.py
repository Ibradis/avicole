from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class Vente(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='ventes', null=True, blank=True)
    STATUT_PAYEMENT_CHOICES = (
        ('en_attente', 'En attente'),
        ('partiel', 'Partiel'),
        ('paye', 'Payé'),
    )
    
    STATUT_CHOICES = (
        ('brouillon', 'Brouillon'),
        ('valide', 'Validé (Livré)'),
        ('annule', 'Annulé'),
    )

    client = models.ForeignKey('partenaires.Partenaire', on_delete=models.RESTRICT, related_name='ventes', null=True, blank=True)
    boutique_dest = models.ForeignKey('boutiques.Boutique', on_delete=models.SET_NULL, null=True, blank=True, related_name='ventes_recues')
    date_vente = models.DateField()
    date_livraison = models.DateField(null=True, blank=True)
    reference = models.CharField(max_length=150, blank=True, null=True)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    statut_paiement = models.CharField(max_length=20, choices=STATUT_PAYEMENT_CHOICES, default='en_attente')
    observations = models.TextField(blank=True, null=True)
    
    reception_confirmee = models.BooleanField(default=False)
    date_reception = models.DateField(null=True, blank=True)
    
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    
    portefeuille = models.ForeignKey('finances.Portefeuille', on_delete=models.SET_NULL, null=True, blank=True, related_name='ventes')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Vente {self.id} du {self.date_vente}"

class LigneVente(models.Model):
    vente = models.ForeignKey(Vente, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey('produits.Produit', on_delete=models.RESTRICT)
    quantite = models.DecimalField(max_digits=10, decimal_places=2)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    sous_total = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.sous_total = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantite} x {self.produit.nom}"

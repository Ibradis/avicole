from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class CofoOperation(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='cofo_operations', null=True, blank=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), default='ferme')
    entite_id = models.IntegerField(null=True, blank=True)
    TYPE_OP_CHOICES = (
        ('achat', 'Achat'),
        ('vente', 'Vente'),
    )

    type_operation = models.CharField(max_length=20, choices=TYPE_OP_CHOICES)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    fournisseur = models.CharField(max_length=150, blank=True, null=True)
    client = models.CharField(max_length=150, blank=True, null=True)
    quantite_sacs = models.IntegerField(blank=True, null=True)
    date_operation = models.DateField()
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_type_operation_display()} COFO - {self.montant}"

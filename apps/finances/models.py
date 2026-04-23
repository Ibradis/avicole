from django.db import models
from apps.common.models import TenantManager

# Définition de la table en base de données
class Portefeuille(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='portefeuilles', null=True, blank=True)
    TYPE_PF_CHOICES = (
        ('caisse', 'Caisse'),
        ('banque', 'Banque'),
    )
    TYPE_ENTITE_CHOICES = (
        ('ferme', 'Ferme'),
        ('boutique', 'Boutique'),
    )
    STATUT_CHOICES = (
        ('actif', 'Actif'),
        ('inactif', 'Inactif'),
        ('cloture', 'Clôturé'),
    )

    nom = models.CharField(max_length=150)
    type = models.CharField(max_length=20, choices=TYPE_PF_CHOICES)
    entite_id = models.IntegerField(null=True, blank=True)  # ID de la ferme ou boutique
    entite_type = models.CharField(max_length=20, choices=TYPE_ENTITE_CHOICES, null=True, blank=True)
    
    solde_init = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    solde_actuel = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    nom_banque = models.CharField(max_length=150, blank=True, null=True)
    numero_compte = models.CharField(max_length=80, blank=True, null=True)
    titulaire = models.CharField(max_length=150, blank=True, null=True)
    
    devise = models.CharField(max_length=10, default='GNF')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='actif')
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nom} ({self.get_type_display()}) - {self.get_entite_type_display()}"


# Définition de la table en base de données
class MouvementCaisse(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='mouvements', null=True, blank=True)
    SOURCE_DEST_CHOICES = (
        ('portefeuille', 'Portefeuille'),
        ('tiers', 'Tiers'),
    )
    NATURE_CHOICES = (
        ('vente', 'Vente'),
        ('achat', 'Achat'),
        ('achat_cofo', 'Achat COFO'),
        ('vente_cofo', 'Vente COFO'),
        ('veterinaire', 'Vétérinaire'),
        ('charge', 'Charge'),
        ('transfert_portefeuille', 'Transfert Portefeuille'),
    )

    source_type = models.CharField(max_length=20, choices=SOURCE_DEST_CHOICES)
    source_id = models.ForeignKey(Portefeuille, on_delete=models.RESTRICT, related_name='mouvements_sortants', null=True, blank=True)
    
    dest_type = models.CharField(max_length=20, choices=SOURCE_DEST_CHOICES)
    dest_id = models.ForeignKey(Portefeuille, on_delete=models.RESTRICT, related_name='mouvements_entrants', null=True, blank=True)
    
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    nature = models.CharField(max_length=50, choices=NATURE_CHOICES)
    
    id_type_charge = models.ForeignKey('charges.TypeCharge', on_delete=models.RESTRICT, null=True, blank=True)
    
    reference_table = models.CharField(max_length=100, blank=True, null=True)
    reference_id = models.IntegerField(null=True, blank=True)
    
    description = models.TextField(blank=True, null=True)
    date_mouvement = models.DateField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('utilisateurs.Utilisateur', on_delete=models.SET_NULL, null=True, blank=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        from apps.partenaires.models import Partenaire

        # Validation de cohérence d'entité pour les règlements partenaires
        if self.reference_table == 'partenaires' and self.reference_id:
            try:
                partenaire = Partenaire.objects.get(id=self.reference_id)
                
                # Le portefeuille source (si c'est un décaissement) ou destination (si c'est un encaissement)
                # doit correspondre à l'entité du partenaire.
                pf = self.source_id if self.source_type == 'portefeuille' else self.dest_id
                
                if pf and (pf.entite_type != partenaire.entite_type or pf.entite_id != partenaire.entite_id):
                    raise ValidationError(
                        f"Incohérence d'entité : Vous ne pouvez pas effectuer un paiement pour un partenaire rattaché à "
                        f"({partenaire.get_entite_type_display()} ID:{partenaire.entite_id}) "
                        f"en utilisant un portefeuille de ({pf.get_entite_type_display()} ID:{pf.entite_id})."
                    )
            except Partenaire.DoesNotExist:
                pass

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class DemandePaiementInterne(models.Model):
    objects = TenantManager()
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='demandes_paiement', null=True, blank=True)
    
    STATUT_CHOICES = (
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
    )

    vente = models.ForeignKey('ventes.Vente', on_delete=models.CASCADE, related_name='demandes_paiement')
    achat = models.ForeignKey('achats.Achat', on_delete=models.CASCADE, related_name='demandes_paiement', null=True, blank=True)
    
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    
    source_portefeuille = models.ForeignKey(Portefeuille, on_delete=models.RESTRICT, related_name='demandes_paiement_sortantes')
    dest_portefeuille = models.ForeignKey(Portefeuille, on_delete=models.RESTRICT, related_name='demandes_paiement_entrantes', null=True, blank=True)
    
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    
    initiateur = models.ForeignKey('utilisateurs.Utilisateur', on_delete=models.SET_NULL, null=True, related_name='demandes_initiees')
    validateur = models.ForeignKey('utilisateurs.Utilisateur', on_delete=models.SET_NULL, null=True, blank=True, related_name='demandes_validees')
    
    date_demande = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Demande {self.id} : {self.montant} ({self.get_statut_display()})"

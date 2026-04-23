from django.db import models

class Organisation(models.Model):
    PLAN_CHOICES = (
        ("gratuit", "Gratuit"),
        ("standard", "Standard"),
        ("premium", "Premium"),
    )
    STATUT_CHOICES = (
        ("actif", "Actif"),
        ("suspendu", "Suspendu"),
        ("resilie", "Résilié"),
    )

    nom = models.CharField(max_length=200)
    slug = models.SlugField(max_length=100, unique=True)
    pays = models.CharField(max_length=50)
    devise = models.CharField(max_length=10, default="GNF")
    email_contact = models.EmailField(max_length=150)
    telephone = models.CharField(max_length=30, blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to="organisations/logos/", blank=True, null=True)
    id_proprietaire = models.ForeignKey(
        "utilisateurs.Utilisateur",
        on_delete=models.SET_NULL,
        related_name="organisations_possedees",
        null=True,
        blank=True,
    )
    
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="gratuit")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="actif")
    
    date_inscription = models.DateTimeField(auto_now_add=True)
    date_expiration = models.DateField(blank=True, null=True)

    def __str__(self):
        return self.nom

    class Meta:
        verbose_name = "Organisation"
        verbose_name_plural = "Organisations"

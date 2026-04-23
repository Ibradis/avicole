# Modèle de données pour cette application (représentation en base des entités).
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class UtilisateurManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email est obligatoire')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)

class Utilisateur(AbstractUser):
    organisation = models.ForeignKey('organisations.Organisation', on_delete=models.CASCADE, related_name='utilisateurs', null=True, blank=True)
    ferme = models.ForeignKey('ferme.Ferme', on_delete=models.CASCADE, related_name='%(class)ss_ferme', null=True, blank=True)
    username = None
    email = models.EmailField('adresse email', unique=True)
    
    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('pdg', 'PDG'),
        ('controleur', 'Contrôleur'),
        ('gerant', 'Gérant de Boutique'),
        ('vendeur', 'Vendeur'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='controleur')
    telephone = models.CharField(max_length=20, blank=True, null=True)
    entite_type = models.CharField(max_length=20, choices=(('ferme', 'Ferme'), ('boutique', 'Boutique')), null=True, blank=True)
    entite_id = models.IntegerField(null=True, blank=True)
    doit_changer_mdp = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UtilisateurManager()

    @property
    def is_boutique_scoped(self):
        return self.entite_type == 'boutique' and self.entite_id is not None

    @property
    def is_ferme_scoped(self):
        return self.entite_type == 'ferme' and self.entite_id is not None

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

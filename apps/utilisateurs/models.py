# Modèle de données pour cette application (représentation en base des entités).
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone

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


class EmailConfirmation(models.Model):
    """Code de confirmation 6 chiffres envoyé par email (inscription, etc.)."""

    PURPOSE_REGISTRATION = "registration"
    PURPOSE_CHOICES = (
        (PURPOSE_REGISTRATION, "Inscription"),
    )

    user = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name="email_confirmations",
    )
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default=PURPOSE_REGISTRATION)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "purpose", "used_at"]),
        ]

    def __str__(self):
        return f"Confirmation {self.purpose} pour {self.user.email}"

    @classmethod
    def generate_code(cls) -> str:
        """Génère un code numérique de 6 chiffres."""
        return f"{secrets.randbelow(1_000_000):06d}"

    @classmethod
    def issue(cls, user: "Utilisateur", purpose: str = PURPOSE_REGISTRATION) -> "EmailConfirmation":
        """Invalide les codes précédents non utilisés et émet un nouveau code."""
        cls.objects.filter(user=user, purpose=purpose, used_at__isnull=True).update(
            used_at=timezone.now()
        )
        ttl_minutes = getattr(settings, "EMAIL_CONFIRMATION_TTL_MINUTES", 15)
        return cls.objects.create(
            user=user,
            code=cls.generate_code(),
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=ttl_minutes),
        )

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_used(self) -> bool:
        return self.used_at is not None

    def mark_used(self) -> None:
        self.used_at = timezone.now()
        self.save(update_fields=["used_at"])

"""Envoi d'emails liés au cycle de vie utilisateur (confirmation d'inscription, etc.)."""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from .models import EmailConfirmation, Utilisateur

logger = logging.getLogger(__name__)


def _user_display_name(user: Utilisateur) -> str:
    full = f"{user.first_name} {user.last_name}".strip()
    return full or user.email


def send_registration_confirmation(user: Utilisateur, confirmation: EmailConfirmation) -> None:
    """Envoie l'email de confirmation d'inscription avec le code à 6 chiffres."""
    ttl_minutes = getattr(settings, "EMAIL_CONFIRMATION_TTL_MINUTES", 15)
    subject = "Confirmez votre compte Avicole ERP"
    greeting = _user_display_name(user)

    text_body = (
        f"Bonjour {greeting},\n\n"
        f"Bienvenue sur Avicole ERP. Pour activer votre compte, saisissez le code suivant "
        f"dans la page de confirmation :\n\n"
        f"    {confirmation.code}\n\n"
        f"Ce code expire dans {ttl_minutes} minutes.\n\n"
        f"Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.\n\n"
        f"— L'équipe Avicole ERP"
    )

    html_body = f"""
    <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <div style="background: #111827; padding: 24px; border-radius: 12px 12px 0 0; color: #fff;">
        <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.6);">Avicole ERP</div>
        <h1 style="margin: 8px 0 0; font-size: 20px;">Confirmez votre compte</h1>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
        <p style="margin-top: 0;">Bonjour <strong>{greeting}</strong>,</p>
        <p>Pour finaliser votre inscription, saisissez ce code dans la page de confirmation&nbsp;:</p>
        <div style="font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 30px; letter-spacing: 0.4em; font-weight: 700; color: #1B6B35; background: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
          {confirmation.code}
        </div>
        <p style="font-size: 13px; color: #475569;">Ce code expire dans <strong>{ttl_minutes} minutes</strong>.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
          Si vous n'avez pas créé de compte, vous pouvez ignorer ce message en toute sécurité.
        </p>
      </div>
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 18px;">
        — Équipe Avicole ERP
      </p>
    </div>
    """

    try:
        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)
    except Exception:  # pragma: no cover - logging path
        logger.exception("Impossible d'envoyer l'email de confirmation à %s", user.email)
        raise

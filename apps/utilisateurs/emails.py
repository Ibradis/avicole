"""Envoi d'emails liés au cycle de vie utilisateur (confirmation d'inscription, etc.)."""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from .models import EmailConfirmation, Utilisateur

logger = logging.getLogger(__name__)

ROLE_LABELS = {
    "admin": "Administrateur",
    "pdg": "PDG",
    "controleur": "Contrôleur",
    "gerant": "Gérant",
    "vendeur": "Vendeur",
}


def _user_display_name(user: Utilisateur) -> str:
    full = f"{user.first_name} {user.last_name}".strip()
    return full or user.email


def _login_url() -> str:
    base = getattr(settings, "FRONTEND_URL", "http://localhost:13000").rstrip("/")
    return f"{base}/login"


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


def send_account_invitation(user: Utilisateur, temp_password: str, invited_by: Utilisateur | None = None) -> None:
    """Envoie un email d'invitation avec les identifiants temporaires."""
    organisation_nom = ""
    if user.organisation is not None:
        organisation_nom = getattr(user.organisation, "nom", "") or ""

    role_label = ROLE_LABELS.get(user.role, user.role or "")
    inviter_name = _user_display_name(invited_by) if invited_by else ""
    greeting = _user_display_name(user)
    login_url = _login_url()

    subject = f"Votre compte Avicole ERP est prêt"

    inviter_text = f" par {inviter_name}" if inviter_name else ""
    org_text = f" pour l'organisation {organisation_nom}" if organisation_nom else ""

    text_body = (
        f"Bonjour {greeting},\n\n"
        f"Un compte vous a été créé sur Avicole ERP{inviter_text}{org_text}.\n\n"
        f"Vos identifiants de connexion :\n"
        f"  • Email     : {user.email}\n"
        f"  • Mot de passe temporaire : {temp_password}\n"
        f"  • Rôle      : {role_label}\n\n"
        f"Connectez-vous ici : {login_url}\n\n"
        f"Pour des raisons de sécurité, vous serez invité à changer ce mot de passe "
        f"dès votre première connexion.\n\n"
        f"— L'équipe Avicole ERP"
    )

    inviter_html = f" par <strong>{inviter_name}</strong>" if inviter_name else ""
    org_html = (
        f" pour l'organisation <strong>{organisation_nom}</strong>"
        if organisation_nom
        else ""
    )

    html_body = f"""
    <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0f172a;">
      <div style="background: #111827; padding: 24px; border-radius: 12px 12px 0 0; color: #fff;">
        <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.6);">Avicole ERP</div>
        <h1 style="margin: 8px 0 0; font-size: 20px;">Votre compte est prêt</h1>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
        <p style="margin-top: 0;">Bonjour <strong>{greeting}</strong>,</p>
        <p>Un compte vous a été créé sur Avicole ERP{inviter_html}{org_html}.</p>

        <div style="margin: 22px 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="background: #f8fafc;">
              <th style="text-align: left; padding: 10px 14px; color: #475569; font-weight: 600; width: 40%;">Email</th>
              <td style="padding: 10px 14px;">{user.email}</td>
            </tr>
            <tr>
              <th style="text-align: left; padding: 10px 14px; color: #475569; font-weight: 600; border-top: 1px solid #e2e8f0;">Mot de passe temporaire</th>
              <td style="padding: 10px 14px; border-top: 1px solid #e2e8f0; font-family: 'JetBrains Mono', 'Courier New', monospace; font-weight: 700; color: #1B6B35;">{temp_password}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <th style="text-align: left; padding: 10px 14px; color: #475569; font-weight: 600; border-top: 1px solid #e2e8f0;">Rôle</th>
              <td style="padding: 10px 14px; border-top: 1px solid #e2e8f0;">{role_label}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="{login_url}" style="display: inline-block; background: #1B6B35; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 600;">Me connecter</a>
        </div>

        <div style="background: #ecfdf5; border-left: 4px solid #1B6B35; padding: 12px 14px; border-radius: 6px; font-size: 13px; color: #475569;">
          🔒 Pour votre sécurité, vous serez invité à <strong>changer ce mot de passe</strong> dès votre première connexion.
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
          Si vous n'attendez pas cet email, ignorez-le ou contactez votre administrateur.
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
        logger.exception("Impossible d'envoyer l'invitation à %s", user.email)
        raise

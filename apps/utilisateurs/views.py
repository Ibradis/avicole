# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from django.conf import settings
from django.utils import timezone

from .emails import send_registration_confirmation
from .models import EmailConfirmation
from .serializers import (
    UtilisateurReadSerializer, UtilisateurWriteSerializer,
    PasswordResetSerializer, InviteUserSerializer, ActivateAccountSerializer,
    LoginSerializer, ConfirmRegistrationSerializer, ResendConfirmationSerializer,
)
from .permissions import IsOrganisationAdmin, IsOwnerOrAdmin

Utilisateur = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Connexion utilisateur",
        description="Authentifie un utilisateur via email/mot de passe et retourne des JWT (access + refresh).",
        request=LoginSerializer, 
        responses={200: dict}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            if user.is_active:
                tokens = get_tokens_for_user(user)
                user_data = UtilisateurReadSerializer(user).data
                return Response({**tokens, "user": user_data}, status=status.HTTP_200_OK)
            else:
                return Response({"detail": "Compte inactif"}, status=status.HTTP_403_FORBIDDEN)
        return Response({"detail": "Identifiants invalides"}, status=status.HTTP_401_UNAUTHORIZED)

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="Rafraîchir le token",
        description="Échange un refresh token contre un nouvel access token valide.",
        responses={200: dict}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({"detail": "Le token de rafraîchissement est requis."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            return Response({'access': str(token.access_token)}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"detail": "Token invalide ou expiré."}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Déconnexion",
        description="Invalide le refresh token actif passé dans la payload afin qu'il ne puisse plus être réutilisé.",
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Réinitialisation du mot de passe",
        description="Envoie un lien ou un code par email pour permettre la réinitialisation du mot de passe perdu.",
        request=PasswordResetSerializer
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"detail": "Si cet email existe, un lien de réinitialisation a été envoyé."}, status=status.HTTP_200_OK)

class InviteUserView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Inviter un utilisateur",
        description="Inviter un nouveau collaborateur au sein de l'application. Nécessite les droits administrateur ou gérant (pour vendeurs).",
        request=InviteUserSerializer
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        if request.user.role not in ['admin', 'pdg']:
            if request.user.role == 'gerant':
                if data.get('role') != 'vendeur':
                    return Response({"detail": "Vous ne pouvez inviter que des vendeurs pour votre boutique."}, status=status.HTTP_403_FORBIDDEN)
                data['entite_type'] = 'boutique'
                data['entite_id'] = request.user.entite_id
            else:
                return Response({"detail": "Vous n'avez pas la permission d'inviter des utilisateurs."}, status=status.HTTP_403_FORBIDDEN)

        serializer = InviteUserSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response({"detail": "Invitation envoyée avec succès."}, status=status.HTTP_200_OK)

class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Activer un compte",
        description="Saisir le token d'invitation et définir un mot de passe initial pour activer le compte collaborateur.",
        request=ActivateAccountSerializer
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        serializer = ActivateAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"detail": "Compte activé avec succès."}, status=status.HTTP_200_OK)


def _get_pending_user(email: str):
    return Utilisateur.objects.filter(email__iexact=email).first()


class ConfirmRegistrationView(APIView):
    """Valide le code reçu par email après inscription et active le compte."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Confirmer l'inscription",
        description="Vérifie le code à 6 chiffres reçu par email et active le compte. Retourne des tokens JWT.",
        request=ConfirmRegistrationSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = ConfirmRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        code = serializer.validated_data["code"]

        user = _get_pending_user(email)
        if user is None:
            return Response(
                {"detail": "Aucun compte trouvé pour cet email."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_active:
            return Response(
                {"detail": "Ce compte est déjà confirmé. Connectez-vous."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        confirmation = (
            EmailConfirmation.objects
            .filter(user=user, purpose=EmailConfirmation.PURPOSE_REGISTRATION, used_at__isnull=True)
            .order_by("-created_at")
            .first()
        )

        if confirmation is None:
            return Response(
                {"detail": "Aucun code actif. Demandez un nouveau code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if confirmation.is_expired:
            return Response(
                {"detail": "Le code a expiré. Demandez un nouveau code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_attempts = getattr(settings, "EMAIL_CONFIRMATION_MAX_ATTEMPTS", 5)
        if confirmation.attempts >= max_attempts:
            confirmation.mark_used()
            return Response(
                {"detail": "Trop de tentatives. Demandez un nouveau code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if confirmation.code != code:
            confirmation.attempts += 1
            confirmation.save(update_fields=["attempts"])
            remaining = max_attempts - confirmation.attempts
            return Response(
                {
                    "detail": "Code incorrect.",
                    "remaining_attempts": max(remaining, 0),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Code valide → activer + générer tokens
        confirmation.mark_used()
        user.is_active = True
        user.save(update_fields=["is_active"])
        tokens = get_tokens_for_user(user)

        return Response(
            {
                **tokens,
                "user": UtilisateurReadSerializer(user).data,
                "detail": "Compte confirmé.",
            },
            status=status.HTTP_200_OK,
        )


class ResendConfirmationView(APIView):
    """Régénère un code de confirmation et renvoie l'email."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Renvoyer un code de confirmation",
        description="Génère un nouveau code à 6 chiffres et l'envoie par email. Soumis à un cooldown.",
        request=ResendConfirmationSerializer,
    )
    def post(self, request):
        serializer = ResendConfirmationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()

        user = _get_pending_user(email)
        # Ne pas révéler si l'email existe — retour neutre.
        generic_response = Response(
            {"detail": "Si un compte est en attente, un nouveau code a été envoyé."},
            status=status.HTTP_200_OK,
        )

        if user is None or user.is_active:
            return generic_response

        cooldown_seconds = getattr(settings, "EMAIL_CONFIRMATION_RESEND_COOLDOWN_SECONDS", 60)
        last = (
            EmailConfirmation.objects
            .filter(user=user, purpose=EmailConfirmation.PURPOSE_REGISTRATION)
            .order_by("-created_at")
            .first()
        )
        if last is not None:
            elapsed = (timezone.now() - last.created_at).total_seconds()
            if elapsed < cooldown_seconds:
                wait = int(cooldown_seconds - elapsed)
                return Response(
                    {
                        "detail": f"Veuillez patienter {wait} seconde(s) avant de redemander un code.",
                        "retry_after": wait,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        confirmation = EmailConfirmation.issue(user)
        try:
            send_registration_confirmation(user, confirmation)
        except Exception:
            return Response(
                {"detail": "Impossible d'envoyer l'email. Réessayez plus tard."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return generic_response

class UtilisateurListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Lister les utilisateurs",
        description="Récupère la liste complète des utilisateurs enregistrés sur la plateforme SaaS.",
        responses={200: UtilisateurReadSerializer(many=True)}
    )
    def get(self, request):
        queryset = Utilisateur.objects.filter(organisation=request.user.organisation)
        
        # Le gérant ne voit que les utilisateurs de sa propre boutique
        if request.user.role == 'gerant':
            queryset = queryset.filter(entite_type='boutique', entite_id=request.user.entite_id)
        elif request.user.role not in ['admin', 'pdg']:
            queryset = queryset.filter(id=request.user.id)
        
        entite_type = request.query_params.get('entite_type')
        entite_id = request.query_params.get('entite_id')
        
        if entite_type:
            queryset = queryset.filter(entite_type=entite_type)
        if entite_id:
            queryset = queryset.filter(entite_id=entite_id)
            
        serializer = UtilisateurReadSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    @extend_schema(
        summary="Créer un utilisateur",
        description="Créer directement un profil utilisateur.",
        request=UtilisateurWriteSerializer, 
        responses={201: UtilisateurReadSerializer}
    )
    # Fonction de création (POST) validant et insérant une ressource
    def post(self, request):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        if request.user.role not in ['admin', 'pdg']:
            if request.user.role == 'gerant':
                if data.get('role') != 'vendeur':
                    return Response({"detail": "Vous ne pouvez créer que des vendeurs pour votre boutique."}, status=status.HTTP_403_FORBIDDEN)
                data['entite_type'] = 'boutique'
                data['entite_id'] = request.user.entite_id
            else:
                return Response({"detail": "Vous n'avez pas la permission de créer des utilisateurs."}, status=status.HTTP_403_FORBIDDEN)

        serializer = UtilisateurWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(organisation=request.user.organisation)
        return Response(UtilisateurReadSerializer(user).data, status=status.HTTP_201_CREATED)

class UtilisateurDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_object(self, pk):
        obj = get_object_or_404(Utilisateur, pk=pk)
        self.check_object_permissions(self.request, obj)
        return obj

    @extend_schema(
        summary="Détails de l'utilisateur",
        description="Obtenir les informations précises d'un compte particulier grâce à son ID.",
        responses={200: UtilisateurReadSerializer}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk):
        serializer = UtilisateurReadSerializer(self.get_object(pk))
        return Response(serializer.data)

    @extend_schema(
        summary="Modifier un utilisateur",
        description="Permet une mutation partielle (PATCH) sur les informations de l'utilisateur visé.",
        request=UtilisateurWriteSerializer, 
        responses={200: UtilisateurReadSerializer}
    )
    # Fonction de mise à jour (PATCH) partielle de la ressource
    def patch(self, request, pk):
        instance = self.get_object(pk)
        
        # Sécurité : Seuls les admins peuvent changer le rôle ou l'organisation
        if request.user.role not in ['admin', 'pdg']:
            if 'role' in request.data or 'organisation' in request.data:
                return Response(
                    {"detail": "Vous n'avez pas la permission de modifier le rôle ou l'organisation."},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = UtilisateurWriteSerializer(
            instance, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(organisation=request.user.organisation)
        return Response(serializer.data)

    @extend_schema(
        summary="Désactiver un compte",
        description="Applique une suppression logique (Soft Delete) sur cet utilisateur pour interdire ses connexions sans perdre l'historique de ses saisies.",
        responses={204: None}
    )
    # Fonction de suppression (DELETE) logique ou physique
    def delete(self, request, pk):
        user = self.get_object(pk)
        user.is_active = False # Soft delete
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

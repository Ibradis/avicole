import logging

from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.utilisateurs.permissions import IsOrganisationAdminOrReadOnly
from .models import Organisation
from .serializers import OrganisationInscriptionSerializer, OrganisationReadSerializer

logger = logging.getLogger(__name__)


class OrganisationInscriptionView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Inscription publique SaaS",
        description=(
            "Crée une organisation, sa ferme initiale et le compte administrateur "
            "(inactif), puis envoie un code de confirmation par email."
        ),
        request=OrganisationInscriptionSerializer,
        responses={201: dict},
    )
    def post(self, request):
        serializer = OrganisationInscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = serializer.save()
        user = created["user"]

        return Response(
            {
                "detail": "Un code de confirmation a été envoyé à votre email.",
                "email": user.email,
                "organisation_nom": created["organisation"].nom,
                "expires_at": created["confirmation"].expires_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class OrganisationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganisationReadSerializer
    permission_classes = [IsAuthenticated, IsOrganisationAdminOrReadOnly]

    def get_object(self):
        user = self.request.user
        org = user.organisation
        if not org:
            logger.error(f"User {user.email} has no organisation linked.")
            raise NotFound("Votre compte n'est rattaché à aucune organisation.")
        return org

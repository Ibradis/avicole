from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.utilisateurs.serializers import UtilisateurReadSerializer
from apps.utilisateurs.views import get_tokens_for_user
from .serializers import OrganisationInscriptionSerializer, OrganisationReadSerializer
from .models import Organisation

class OrganisationInscriptionView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Inscription publique SaaS",
        description="Crée une organisation, sa ferme initiale et le compte administrateur.",
        request=OrganisationInscriptionSerializer,
        responses={201: dict},
    )
    def post(self, request):
        serializer = OrganisationInscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = serializer.save()
        user = created["user"]
        tokens = get_tokens_for_user(user)

        return Response(
            {
                **tokens,
                "organisation": OrganisationReadSerializer(created["organisation"]).data,
                "ferme": {"id": created["ferme"].id, "nom": created["ferme"].nom},
                "user": UtilisateurReadSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

from rest_framework.exceptions import NotFound
import logging

from apps.utilisateurs.permissions import IsOrganisationAdminOrReadOnly

logger = logging.getLogger(__name__)

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

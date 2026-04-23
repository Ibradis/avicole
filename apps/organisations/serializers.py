from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers

from apps.ferme.models import Ferme
from .models import Organisation

Utilisateur = get_user_model()


class OrganisationInscriptionSerializer(serializers.Serializer):
    organisation_nom = serializers.CharField(max_length=200)
    pays = serializers.CharField(max_length=50)
    devise = serializers.CharField(max_length=10, default="GNF")
    admin_nom = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate_email(self, value):
        if Utilisateur.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un utilisateur existe déjà avec cet email.")
        return value.lower()

    def validate_devise(self, value):
        if value != "GNF":
            raise serializers.ValidationError("La devise initiale doit être GNF.")
        return value

    def _unique_slug(self, nom):
        base_slug = slugify(nom) or "organisation"
        slug = base_slug
        index = 2
        while Organisation.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{index}"
            index += 1
        return slug

    @transaction.atomic
    def create(self, validated_data):
        admin_nom = validated_data.pop("admin_nom")
        password = validated_data.pop("password")
        email = validated_data.pop("email")
        telephone = validated_data.get("telephone", "")
        organisation_nom = validated_data.pop("organisation_nom")

        organisation = Organisation.objects.create(
            nom=organisation_nom,
            slug=self._unique_slug(organisation_nom),
            pays=validated_data["pays"],
            devise=validated_data["devise"],
            email_contact=email,
            telephone=telephone or None,
            plan="gratuit",
            statut="actif",
        )

        ferme = Ferme.objects.create(
            organisation=organisation,
            nom=organisation_nom,
            telephone=telephone or None,
            email=email,
            actif=True,
        )

        name_parts = admin_nom.strip().split(" ", 1)
        user = Utilisateur.objects.create_user(
            email=email,
            password=password,
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else "",
            role="admin",
            telephone=telephone or None,
            organisation=organisation,
            is_active=True,
        )

        organisation.id_proprietaire = user
        organisation.save(update_fields=["id_proprietaire"])

        return {"organisation": organisation, "ferme": ferme, "user": user}


class OrganisationReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = [
            "id",
            "nom",
            "slug",
            "pays",
            "devise",
            "email_contact",
            "telephone",
            "id_proprietaire",
            "plan",
            "statut",
            "date_inscription",
        ]

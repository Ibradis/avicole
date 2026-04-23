import django.db.models.deletion
from django.db import migrations, models


def assign_existing_owner(apps, schema_editor):
    Organisation = apps.get_model("organisations", "Organisation")
    Utilisateur = apps.get_model("utilisateurs", "Utilisateur")
    for organisation in Organisation.objects.filter(id_proprietaire__isnull=True):
        owner = (
            Utilisateur.objects.filter(organisation=organisation, role="admin")
            .order_by("date_joined", "id")
            .first()
        )
        if owner:
            organisation.id_proprietaire = owner
            organisation.save(update_fields=["id_proprietaire"])


class Migration(migrations.Migration):

    dependencies = [
        ("organisations", "0001_initial"),
        ("utilisateurs", "0003_utilisateur_entite_scope"),
    ]

    operations = [
        migrations.AddField(
            model_name="organisation",
            name="id_proprietaire",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="organisations_possedees", to="utilisateurs.utilisateur"),
        ),
        migrations.RunPython(assign_existing_owner, migrations.RunPython.noop),
    ]

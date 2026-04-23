from django.db import migrations, models


def migrate_user_entity_scope(apps, schema_editor):
    Utilisateur = apps.get_model("utilisateurs", "Utilisateur")
    for user in Utilisateur.objects.all():
        entite_type = None
        entite_id = None

        if user.role in ("gerant", "vendeur") and user.id_boutique:
            entite_type = "boutique"
            entite_id = user.id_boutique
        elif user.role == "controleur" and user.ferme_id:
            entite_type = "ferme"
            entite_id = user.ferme_id

        if entite_type and entite_id:
            user.entite_type = entite_type
            user.entite_id = entite_id
            user.save(update_fields=["entite_type", "entite_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("utilisateurs", "0002_utilisateur_organisation_alter_utilisateur_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="utilisateur",
            name="entite_type",
            field=models.CharField(blank=True, choices=[("ferme", "Ferme"), ("boutique", "Boutique")], max_length=20, null=True),
        ),
        migrations.AddField(
            model_name="utilisateur",
            name="entite_id",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.RunPython(migrate_user_entity_scope, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="utilisateur",
            name="id_boutique",
        ),
    ]

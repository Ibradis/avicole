from django.contrib import admin
from .models import Partenaire

@admin.register(Partenaire)
class PartenaireAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "type", "entite_type", "entite_id", "telephone", "solde_actuel", "actif", "organisation")
    list_filter = ("type", "entite_type", "actif", "organisation")
    search_fields = ("nom", "telephone", "email")
    readonly_fields = ("solde_actuel",)

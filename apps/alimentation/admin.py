from django.contrib import admin
from .models import Consommation

@admin.register(Consommation)
class ConsommationAdmin(admin.ModelAdmin):
    list_display = ("id", "date_consommation", "lot", "produit", "quantite", "organisation")
    list_filter = ("date_consommation", "produit", "organisation")
    search_fields = ("lot__code", "produit__libelle")

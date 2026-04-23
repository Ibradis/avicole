from django.contrib import admin
from .models import Vaccination, Traitement, Mortalite

@admin.register(Vaccination)
class VaccinationAdmin(admin.ModelAdmin):
    list_display = ("id", "date_vaccination", "lot", "produit", "organisation")
    list_filter = ("date_vaccination", "organisation")

@admin.register(Traitement)
class TraitementAdmin(admin.ModelAdmin):
    list_display = ("id", "date_debut", "lot", "produit", "organisation")
    list_filter = ("date_debut", "organisation")

@admin.register(Mortalite)
class MortaliteAdmin(admin.ModelAdmin):
    list_display = ("id", "date", "lot", "quantite", "organisation")
    list_filter = ("date", "organisation")

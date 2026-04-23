from django.contrib import admin
from .models import Veterinaire, Contrat, Intervention

@admin.register(Veterinaire)
class VeterinaireAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "telephone", "email", "actif", "organisation")
    list_filter = ("actif", "organisation")
    search_fields = ("nom", "telephone")

@admin.register(Contrat)
class ContratAdmin(admin.ModelAdmin):
    list_display = ("id", "veterinaire", "date_debut", "date_fin", "organisation")
    list_filter = ("date_debut", "organisation")

@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    list_display = ("id", "date_intervention", "veterinaire", "lot", "organisation")
    list_filter = ("date_intervention", "organisation")

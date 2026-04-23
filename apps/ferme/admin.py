from django.contrib import admin
from .models import Ferme, Lot, ProductionOeuf, RapportJournalier

class LotInline(admin.TabularInline):
    model = Lot
    extra = 1

@admin.register(Ferme)
class FermeAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "organisation", "actif")
    list_filter = ("actif", "organisation")
    search_fields = ("nom",)

@admin.register(Lot)
class LotAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "entite_type", "entite_id", "date_arrivee", "quantite_initiale", "actif", "organisation")
    list_filter = ("entite_type", "actif", "organisation")

@admin.register(ProductionOeuf)
class ProductionOeufAdmin(admin.ModelAdmin):
    list_display = ("id", "lot", "entite_type", "entite_id", "quantite_unites", "organisation")
    list_filter = ("entite_type", "organisation")

@admin.register(RapportJournalier)
class RapportJournalierAdmin(admin.ModelAdmin):
    list_display = ("id", "date_rapport", "entite_type", "entite_id", "statut", "organisation")
    list_filter = ("entite_type", "statut", "organisation")

from django.contrib import admin
from .models import Vente, LigneVente

class LigneVenteInline(admin.TabularInline):
    model = LigneVente
    extra = 1

@admin.register(Vente)
class VenteAdmin(admin.ModelAdmin):
    list_display = ("id", "date_vente", "client", "montant_total", "statut_paiement", "organisation")
    list_filter = ("statut_paiement", "date_vente", "organisation")
    search_fields = ("numero_facture",)
    inlines = [LigneVenteInline]

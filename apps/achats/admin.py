from django.contrib import admin
from .models import Achat, LigneAchat

class LigneAchatInline(admin.TabularInline):
    model = LigneAchat
    extra = 1

@admin.register(Achat)
class AchatAdmin(admin.ModelAdmin):
    list_display = ("id", "date_achat", "fournisseur", "montant_total", "statut_paiement", "organisation")
    list_filter = ("statut_paiement", "date_achat", "organisation")
    search_fields = ("reference",)
    inlines = [LigneAchatInline]

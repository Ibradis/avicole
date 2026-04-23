from django.contrib import admin
from .models import Portefeuille, MouvementCaisse, DemandePaiementInterne

@admin.register(Portefeuille)
class PortefeuilleAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "type", "entite_id", "entite_type", "solde_actuel", "statut", "organisation")
    list_filter = ("type", "entite_type", "statut", "organisation")
    search_fields = ("nom", "numero_compte")

@admin.register(MouvementCaisse)
class MouvementCaisseAdmin(admin.ModelAdmin):
    list_display = ("id", "date_mouvement", "nature", "montant", "source_type", "dest_type", "organisation")
    list_filter = ("nature", "date_mouvement", "organisation")
    search_fields = ("description", "reference_table")

admin.site.register(DemandePaiementInterne)

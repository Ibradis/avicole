from django.contrib import admin
from .models import Stock, MouvementStock

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ("id", "produit", "quantite_actuelle", "seuil_alerte", "organisation")
    list_filter = ("organisation",)

@admin.register(MouvementStock)
class MouvementStockAdmin(admin.ModelAdmin):
    list_display = ("id", "date_mouvement", "type_mouvement", "produit", "quantite", "organisation")
    list_filter = ("type_mouvement", "date_mouvement", "organisation")

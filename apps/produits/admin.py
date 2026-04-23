from django.contrib import admin
from .models import Produit

@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "type", "prix_unitaire", "actif", "organisation")
    list_filter = ("type", "actif", "organisation")
    search_fields = ("nom",)

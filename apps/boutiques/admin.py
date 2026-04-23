from django.contrib import admin
from .models import Boutique

@admin.register(Boutique)
class BoutiqueAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'telephone', 'actif', 'ferme')
    list_filter = ('actif', 'ferme')
    search_fields = ('nom', 'adresse')

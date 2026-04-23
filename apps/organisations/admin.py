from django.contrib import admin
from .models import Organisation

@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "slug", "pays", "id_proprietaire", "plan", "statut", "date_inscription")
    list_filter = ("plan", "statut", "pays")
    search_fields = ("nom", "slug", "email_contact", "id_proprietaire__email")
    prepopulated_fields = {"slug": ("nom",)}

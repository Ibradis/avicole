from django.contrib import admin
from .models import TypeCharge

@admin.register(TypeCharge)
class TypeChargeAdmin(admin.ModelAdmin):
    list_display = ("id", "nom", "actif", "organisation")
    list_filter = ("actif", "organisation")
    search_fields = ("nom",)

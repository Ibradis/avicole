from django.contrib import admin
from .models import CofoOperation

@admin.register(CofoOperation)
class CofoOperationAdmin(admin.ModelAdmin):
    list_display = ("id", "type_operation", "montant", "date_operation", "organisation")
    list_filter = ("type_operation", "date_operation", "organisation")
    search_fields = ("notes",)

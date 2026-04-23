from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur
from .forms import UtilisateurCreationForm, UtilisateurChangeForm

@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    form = UtilisateurChangeForm
    add_form = UtilisateurCreationForm
    
    list_display = ('email', 'first_name', 'last_name', 'role', 'entite_type', 'entite_id', 'is_staff')
    list_filter = ('role', 'entite_type', 'is_staff', 'is_superuser', 'is_active')
    
    # Configuration des champs pour l'édition d'un utilisateur existant
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations Personnelles', {'fields': ('first_name', 'last_name', 'telephone')}),
        ('Droits et Rôles', {'fields': ('role', 'entite_type', 'entite_id', 'ferme', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Configuration des champs pour la création d'un nouvel utilisateur (tous les champs visibles)
    add_fieldsets = (
        (None, {'fields': ('email', 'password1', 'password2')}),
        ('Informations Personnelles', {'fields': ('first_name', 'last_name', 'telephone')}),
        ('Droits et Rôles', {'fields': ('role', 'entite_type', 'entite_id', 'ferme', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

    # Surcharge nécessaire car UserAdmin s'attend à un champ username
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'username' in form.base_fields:
            del form.base_fields['username']
        return form

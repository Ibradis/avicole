from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import Utilisateur

class UtilisateurCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Utilisateur
        fields = (
            'email', 'first_name', 'last_name', 'role', 'ferme', 'entite_type', 'entite_id', 'telephone',
            'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'username' in self.fields:
            del self.fields['username']

class UtilisateurChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = Utilisateur
        fields = ('email', 'role', 'ferme', 'entite_type', 'entite_id', 'telephone')

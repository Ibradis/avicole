import re
from datetime import date
from rest_framework.exceptions import ValidationError

NUMERIC_FIELDS = [
    'montant', 'montant_total', 'prix', 'prix_unitaire',
    'quantite', 'quantite_initiale', 'quantite_actuelle',
    'solde_init', 'solde_actuel',
]
DATE_FIELDS = ['date_mouvement', 'date_rapport', 'date_arrivee']


class AvicoleValidationMixin:
    """Centralise les validations communes à tous les sérialiseurs du projet."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Rend les champs d'entité optionnels globalement pour tous les sérialiseurs
        if hasattr(self, 'fields'):
            for field_name in ['entite_id', 'entite_type']:
                if field_name in self.fields:
                    self.fields[field_name].required = False
                    self.fields[field_name].allow_null = True

    def validate(self, data):
        for field in NUMERIC_FIELDS:
            if field in data and data[field] is not None:
                try:
                    if float(data[field]) < 0:
                        raise ValidationError(
                            {field: f"La valeur de '{field}' ne peut pas être strictement négative."}
                        )
                except (ValueError, TypeError):
                    pass

        telephone = data.get('telephone')
        if telephone and str(telephone).strip():
            if not re.match(r'^\+?\d{8,15}$', str(telephone).replace(' ', '')):
                raise ValidationError(
                    {'telephone': "Le format du numéro de téléphone est invalide (8 à 15 chiffres attendus)."}
                )

        for date_field in DATE_FIELDS:
            if date_field in data and data[date_field] is not None:
                try:
                    if data[date_field] > date.today():
                        raise ValidationError(
                            {date_field: f"La '{date_field}' ne peut pas être définie dans le futur."}
                        )
                except TypeError:
                    pass

        if 'quantite_unites' in data and 'oeufs_casses' in data:
            if data['oeufs_casses'] > data['quantite_unites']:
                raise ValidationError(
                    {'oeufs_casses': "Le nombre d'œufs cassés ne peut excéder le nombre d'œufs générés."}
                )

        # Auto-population de l'ID entité pour la ferme unique de l'organisation
        if data.get('entite_type') == 'ferme' and not data.get('entite_id'):
            request = self.context.get('request')
            if request and hasattr(request.user, 'organisation') and request.user.organisation:
                try:
                    from django.apps import apps
                    Ferme = apps.get_model('ferme', 'Ferme')
                    ferme = Ferme.objects.filter(organisation=request.user.organisation).first()
                    if ferme:
                        data['entite_id'] = ferme.id
                except (ImportError, LookupError):
                    pass
        
        # Nettoyage final : si entite_id est une chaîne vide, le passer à None
        if 'entite_id' in data and data['entite_id'] == "":
            data['entite_id'] = None

        return data

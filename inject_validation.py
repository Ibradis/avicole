import os
import glob
import re

BASE_DIR = "/home/ibrahima-sory/Documents/django_rest_api/avicole2"
os.chdir(BASE_DIR)

generic_validator = """
    def validate(self, data):
        from rest_framework.exceptions import ValidationError
        import re
        from datetime import date
        
        # 1. Validation des montants et quantités (interdiction des négatifs)
        for field in ['montant', 'montant_total', 'prix', 'prix_unitaire', 'quantite', 'quantite_initiale', 'quantite_actuelle', 'solde_init', 'solde_actuel']:
            if field in data and data[field] is not None:
                try:
                    if float(data[field]) < 0:
                        raise ValidationError({field: f"La valeur de '{field}' ne peut pas être strictement négative."})
                except ValueError:
                    pass
        
        # 2. Validation stricte du format des numéros de téléphone locaux/inter
        if 'telephone' in data and data['telephone'] is not None and data['telephone'].strip() != '':
            if not re.match(r'^\+?\d{8,15}$', str(data['telephone']).replace(' ', '')):
                raise ValidationError({'telephone': "Le format du numéro de téléphone est invalide (8 à 15 chiffres attendus)."})
                
        # 3. Validation temporelle (ne pas enregistrer de mouvements/factures dans le futur non atteint)
        for date_field in ['date_mouvement', 'date_rapport', 'date_arrivee']:
            if date_field in data and data[date_field] is not None:
                try:
                    if data[date_field] > date.today():
                        raise ValidationError({date_field: f"La '{date_field}' ne peut logiquement pas être définie dans le futur."})
                except TypeError:
                    pass # En cas d'objet Date as String non-parsé nativement ce qui arrive rarement en input interne DRF

        # Validation conditionnelle spécifique Oeuf production (Les oeufs cassés ne peuvent dépasser la ponte totale)
        if 'quantite_unites' in data and 'oeufs_casses' in data:
            if data['oeufs_casses'] > data['quantite_unites']:
                raise ValidationError({'oeufs_casses': "Le nombre d'œufs cassés ne peut excéder le nombre d'œufs générés."})

        return data
"""

for f in glob.glob('apps/*/serializers.py'):
    with open(f, 'r') as file:
        lines = file.readlines()
    
    new_lines = []
    in_write_meta = False
    
    # Avoid double injection
    if "Validation des montants et quantités" in "".join(lines):
        print(f"Skipping {f}, already injected.")
        continue

    for line in lines:
        new_lines.append(line)
        if 'class ' in line and 'Serializer' in line and not line.startswith(' '):
            # For ANY serializer that takes inputs we inject validation (WriteSerializer primarily)
            if 'Write' in line or 'Serializer(' in line:
                in_write_meta = True
                
        if in_write_meta and 'fields =' in line:
            new_lines.append(generic_validator)
            in_write_meta = False
            
    with open(f, 'w') as file:
        file.writelines(new_lines)
    print(f"Injected validators in {f}")

print("Validation Rules Injection completed!")

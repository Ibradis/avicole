import os
import glob
import re

BASE_DIR = "/home/ibrahima-sory/Documents/django_rest_api/avicole2"
os.chdir(BASE_DIR)

def update_models():
    for f in glob.glob('apps/*/models.py'):
        with open(f, 'r') as file:
            content = file.read()
        
        # Inject Ferme core model 
        if 'ferme/models.py' in f and 'class Ferme' not in content:
            ferme_model = '''
# Modèle central d'isolation SaaS multi-locataire
class Ferme(models.Model):
    nom = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.nom
'''
            content = ferme_model + '\n' + content
            
        lines = content.split('\n')
        new_content = []
        in_utilisateur = False
        for line in lines:
            new_content.append(line)
            
            # Detect model classes (including AbstractUser)
            if line.startswith('class ') and '(' in line and '):' in line and 'Manager' not in line:
                class_name = line.split('class ')[1].split('(')[0].strip()
                if class_name != 'Ferme':
                    new_content.append(f"    ferme = models.ForeignKey('ferme.Ferme', on_delete=models.CASCADE, related_name='%(class)ss_ferme', null=True, blank=True)")
                    
        with open(f, 'w') as file:
            file.write('\n'.join(new_content))
            print(f"Added ferme_id to {f}")

def update_views_get():
    for f in glob.glob('apps/*/views.py'):
        with open(f, 'r') as file:
            content = file.read()
            
        content = re.sub(r'([A-Za-z]+)\.objects\.all\(\)', r'\1.objects.filter(ferme=request.user.ferme)', content)
        # Dashboard custom aggregate injections
        content = content.replace("Vente.objects.aggregate", "Vente.objects.filter(ferme=request.user.ferme).aggregate")
        content = content.replace("Achat.objects.aggregate", "Achat.objects.filter(ferme=request.user.ferme).aggregate")
        content = content.replace("Portefeuille.objects.aggregate", "Portefeuille.objects.filter(ferme=request.user.ferme).aggregate")
        
        with open(f, 'w') as file:
            file.write(content)
            print(f"Secured GET queries in {f}")

def update_views_post():
    for f in glob.glob('apps/*/views.py'):
        with open(f, 'r') as file:
            content = file.read()
        
        # Simple saves
        content = content.replace('serializer.save()', 'serializer.save(ferme=request.user.ferme)')
        
        # Pre-argumented saves
        # E.g serializer.save(cree_par=request.user) -> serializer.save(ferme=request.user.ferme, cree_par=request.user)
        # Check carefully to not double inject if we run it twice
        content = re.sub(r'serializer\.save\((?!ferme=)([^\)]+)\)', r'serializer.save(ferme=request.user.ferme, \1)', content)

        # MouvementCaisse Manual Create (in TransfertPortefeuille)
        content = content.replace(
            "MouvementCaisse.objects.create(", 
            "MouvementCaisse.objects.create(ferme=request.user.ferme, "
        )

        with open(f, 'w') as file:
            file.write(content)
            print(f"Secured POST saving in {f}")

if __name__ == "__main__":
    update_models()
    update_views_get()
    update_views_post()
    print("Multi-tenant implementation complete!")

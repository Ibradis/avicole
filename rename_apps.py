import os
import glob
import re
import shutil

APP_MAP = {
    "users": "utilisateurs",
    "products": "produits",
    "partners": "partenaires",
    "shops": "boutiques",
    "farm": "ferme",
    "feeding": "alimentation",
    "health": "sante",
    "vets": "veterinaires",
    "finance": "finances",
    "purchases": "achats",
    "sales": "ventes",
    "stock": "stocks",
    "reporting": "rapports",
    "exports": "exportations"
}

BASE_DIR = "/home/ibrahima-sory/Documents/django_rest_api/avicole2"

def rename_directories():
    for old, new in APP_MAP.items():
        old_path = os.path.join(BASE_DIR, "apps", old)
        new_path = os.path.join(BASE_DIR, "apps", new)
        if os.path.exists(old_path):
            shutil.move(old_path, new_path)
            print(f"Renamed directory {old} -> {new}")

def update_file_contents():
    # Find all python files
    search_paths = [
        os.path.join(BASE_DIR, "apps", "**", "*.py"),
        os.path.join(BASE_DIR, "config", "**", "*.py"),
        os.path.join(BASE_DIR, "tests", "**", "*.py")
    ]
    
    files = []
    for sp in search_paths:
        files.extend(glob.glob(sp, recursive=True))

    for filepath in files:
        with open(filepath, 'r') as f:
            content = f.read()

        new_content = content
        
        for old, new in APP_MAP.items():
            # Replace apps.old with apps.new
            new_content = re.sub(rf"apps\.{old}\b", f"apps.{new}", new_content)
            
            # Replace ForeignKeys 'old.Model' -> 'new.Model'
            new_content = re.sub(rf"'{old}\.", f"'{new}.", new_content)
            new_content = re.sub(rf'"{old}\.', f'"{new}.', new_content)

        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {filepath}")

def add_comments():
    app_py_paths = glob.glob(os.path.join(BASE_DIR, "apps", "**", "*.py"), recursive=True)
    for filepath in app_py_paths:
        with open(filepath, 'r') as f:
            content = f.read()

        new_content = content
        if 'models.py' in filepath:
            if "# Modèle de données" not in new_content and "class " in new_content:
                new_content = "# Modèle de données pour cette application (représentation en base des entités).\n" + new_content
            # Add inline comments before class Definition
            new_content = re.sub(r'(class [A-Za-z0-9_]+\(models\.Model\):)', r'# Définition de la table en base de données\n\1', new_content)
            
        elif 'views.py' in filepath:
            if "Logique métier et contrôleurs" not in new_content and "class " in new_content:
                new_content = "# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).\n" + new_content
            # Add comments inside views
            new_content = re.sub(r'(\s+def get\(self, request)', r'\n    # Fonction de lecture (GET) retournant une réponse JSON\1', new_content)
            new_content = re.sub(r'(\s+def post\(self, request)', r'\n    # Fonction de création (POST) validant et insérant une ressource\1', new_content)
            new_content = re.sub(r'(\s+def patch\(self, request)', r'\n    # Fonction de mise à jour (PATCH) partielle de la ressource\1', new_content)
            new_content = re.sub(r'(\s+def delete\(self, request)', r'\n    # Fonction de suppression (DELETE) logique ou physique\1', new_content)

        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)

if __name__ == "__main__":
    rename_directories()
    update_file_contents()
    add_comments()
    print("Migration to French app names completed!")

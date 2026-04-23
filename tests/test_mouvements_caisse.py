import pytest
from apps.finances.models import Portefeuille, MouvementCaisse
from django.contrib.auth import get_user_model

Utilisateur = get_user_model()

@pytest.mark.django_db
def test_calcul_solde_portefeuille():
    # Setup
    user = Utilisateur.objects.create_user(email='test@test.com', password='pwd')
    pf = Portefeuille.objects.create(
        nom="Caisse", type="caisse", entite_id=1, entite_type="ferme", solde_init=1000
    )
    
    # Entree
    MouvementCaisse.objects.create(
        source_type='tiers', dest_type='portefeuille', dest_id=pf, montant=500, nature='vente', created_by=user, date_mouvement='2025-01-01'
    )
    
    # Sortie
    MouvementCaisse.objects.create(
        source_type='portefeuille', source_id=pf, dest_type='tiers', montant=200, nature='charge', created_by=user, date_mouvement='2025-01-02'
    )

    from apps.finances.views import calculer_solde_portefeuille
    calculer_solde_portefeuille(pf)
    
    pf.refresh_from_db()
    
    assert pf.solde_actuel == 1300 # 1000 + 500 - 200

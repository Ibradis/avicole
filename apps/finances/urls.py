from django.urls import path
from .views import (
    PortefeuilleListView, PortefeuilleDetailView, PortefeuilleSoldeView,
    MouvementCaisseListView, MouvementCaisseDetailView,
    TransfertPortefeuilleView, TresorerieConsolideeView,
    DemandePaiementInterneListView, DemandePaiementInterneValiderView
)

urlpatterns = [
    path('finances/portefeuilles/', PortefeuilleListView.as_view(), name='pf-list'),
    path('finances/portefeuilles/<int:pk>/', PortefeuilleDetailView.as_view(), name='pf-detail'),
    path('finances/portefeuilles/<int:pk>/solde/', PortefeuilleSoldeView.as_view(), name='pf-solde'),
    
    path('finances/mouvements/', MouvementCaisseListView.as_view(), name='mvt-list'),
    path('finances/mouvements/<int:pk>/', MouvementCaisseDetailView.as_view(), name='mvt-detail'),
    
    path('finances/transfert/', TransfertPortefeuilleView.as_view(), name='pf-transfert'),
    path('finances/tresorerie/consolidee/', TresorerieConsolideeView.as_view(), name='tresorerie'),

    path('finances/demandes-paiement/', DemandePaiementInterneListView.as_view(), name='demande-paiement-list'),
    path('finances/demandes-paiement/<int:pk>/valider/', DemandePaiementInterneValiderView.as_view(), name='demande-paiement-valider'),
]

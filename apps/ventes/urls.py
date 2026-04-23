from django.urls import path
from .views import VenteListView, VenteDetailView, VenteValiderView, VentePayerView, VenteRecevoirView

urlpatterns = [
    path('sales/ventes/', VenteListView.as_view(), name='vente-list'),
    path('sales/ventes/<int:pk>/', VenteDetailView.as_view(), name='vente-detail'),
    path('sales/ventes/<int:pk>/valider/', VenteValiderView.as_view(), name='vente-valider'),
    path('sales/ventes/<int:pk>/recevoir/', VenteRecevoirView.as_view(), name='vente-recevoir'),
    path('sales/ventes/<int:pk>/payer/', VentePayerView.as_view(), name='vente-payer'),
]

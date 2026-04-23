from django.urls import path
from .views import (
    StockListView, StockDetailView,
    StockAlertesView, MouvementStockListView
)

urlpatterns = [
    path('stock/', StockListView.as_view(), name='stock-list'),
    path('stock/alertes/', StockAlertesView.as_view(), name='stock-alerte'),
    path('stock/mouvements/', MouvementStockListView.as_view(), name='stock-mouvement-list'),
    path('stock/<int:pk>/', StockDetailView.as_view(), name='stock-detail'),
]

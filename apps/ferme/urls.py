from django.urls import path
from .views import (
    FermeDetailView,
    LotListView, LotDetailView,
    ProductionOeufListView, ProductionOeufDetailView,
    RapportJournalierListView, RapportJournalierDetailView, RapportJournalierValiderView
)

urlpatterns = [
    path('ferme/', FermeDetailView.as_view(), name='ferme-detail'),
    path('ferme/lots/', LotListView.as_view(), name='lot-list'),
    path('ferme/lots/<int:pk>/', LotDetailView.as_view(), name='lot-detail'),
    
    path('ferme/productions/', ProductionOeufListView.as_view(), name='production-list'),
    path('ferme/productions/<int:pk>/', ProductionOeufDetailView.as_view(), name='production-detail'),
    
    path('ferme/rapports/', RapportJournalierListView.as_view(), name='rapport-list'),
    path('ferme/rapports/<int:pk>/', RapportJournalierDetailView.as_view(), name='rapport-detail'),
    path('ferme/rapports/<int:pk>/valider/', RapportJournalierValiderView.as_view(), name='rapport-valider'),
]

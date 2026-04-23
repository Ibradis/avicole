from django.urls import path
from .views import (
    VeterinaireListView, VeterinaireDetailView,
    ContratListView, ContratDetailView,
    InterventionListView, InterventionDetailView
)

urlpatterns = [
    path('veterinaires/', VeterinaireListView.as_view(), name='veterinaire-list'),
    path('veterinaires/<int:pk>/', VeterinaireDetailView.as_view(), name='veterinaire-detail'),
    
    path('veterinaires/contrats/', ContratListView.as_view(), name='contrat-list'),
    path('veterinaires/contrats/<int:pk>/', ContratDetailView.as_view(), name='contrat-detail'),
    
    path('veterinaires/interventions/', InterventionListView.as_view(), name='intervention-list'),
    path('veterinaires/interventions/<int:pk>/', InterventionDetailView.as_view(), name='intervention-detail'),
]

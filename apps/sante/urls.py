from django.urls import path
from .views import (
    VaccinationListView, VaccinationDetailView,
    TraitementListView, TraitementDetailView,
    MortaliteListView, MortaliteDetailView
)

urlpatterns = [
    path('sante/vaccinations/', VaccinationListView.as_view(), name='vaccination-list'),
    path('sante/vaccinations/<int:pk>/', VaccinationDetailView.as_view(), name='vaccination-detail'),
    
    path('sante/traitements/', TraitementListView.as_view(), name='traitement-list'),
    path('sante/traitements/<int:pk>/', TraitementDetailView.as_view(), name='traitement-detail'),
    
    path('sante/mortalites/', MortaliteListView.as_view(), name='mortalite-list'),
    path('sante/mortalites/<int:pk>/', MortaliteDetailView.as_view(), name='mortalite-detail'),
]

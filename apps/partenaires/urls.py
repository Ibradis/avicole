from django.urls import path
from .views import (
    PartenaireListView, PartenaireDetailView, 
    PartenaireSoldeView, PartenaireRecalculSoldeView
)

urlpatterns = [
    path('partenaires/', PartenaireListView.as_view(), name='partenaire-list'),
    path('partenaires/<int:pk>/', PartenaireDetailView.as_view(), name='partenaire-detail'),
    path('partenaires/<int:pk>/solde/', PartenaireSoldeView.as_view(), name='partenaire-solde'),
    path('partenaires/<int:pk>/recalcul-solde/', PartenaireRecalculSoldeView.as_view(), name='partenaire-recalcul-solde'),
]

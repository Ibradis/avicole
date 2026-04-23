from django.urls import path
from .views import ConsommationListView, ConsommationDetailView

urlpatterns = [
    path('alimentation/consommations/', ConsommationListView.as_view(), name='consommation-list'),
    path('alimentation/consommations/<int:pk>/', ConsommationDetailView.as_view(), name='consommation-detail'),
]

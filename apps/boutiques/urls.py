from django.urls import path
from .views import BoutiqueListView, BoutiqueDetailView

urlpatterns = [
    path('boutiques/', BoutiqueListView.as_view(), name='boutique-list'),
    path('boutiques/<int:pk>/', BoutiqueDetailView.as_view(), name='boutique-detail'),
]

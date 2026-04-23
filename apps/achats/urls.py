from django.urls import path
from .views import AchatListView, AchatDetailView, AchatValiderView, AchatPayerView

urlpatterns = [
    path('achats/', AchatListView.as_view(), name='achat-list'),
    path('achats/<int:pk>/', AchatDetailView.as_view(), name='achat-detail'),
    path('achats/<int:pk>/valider/', AchatValiderView.as_view(), name='achat-valider'),
    path('achats/<int:pk>/payer/', AchatPayerView.as_view(), name='achat-payer'),
]

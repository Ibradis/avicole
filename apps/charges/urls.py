from django.urls import path
from .views import TypeChargeListView, TypeChargeDetailView

urlpatterns = [
    path('charges/types/', TypeChargeListView.as_view(), name='typecharge-list'),
    path('charges/types/<int:pk>/', TypeChargeDetailView.as_view(), name='typecharge-detail'),
]

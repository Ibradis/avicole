from django.urls import path
from .views import CofoOperationListView, CofoOperationDetailView

urlpatterns = [
    path('cofo/', CofoOperationListView.as_view(), name='cofo-list'),
    path('cofo/<int:pk>/', CofoOperationDetailView.as_view(), name='cofo-detail'),
]

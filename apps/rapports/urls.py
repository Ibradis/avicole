from django.urls import path
from .views import (
    TresorerieReportView, ProductionReportView, CoutRevientReportView,
    VentesReportView, AchatsReportView, ChargesReportView, CofoReportView,
    VeterinairesReportView, StockReportView, PartenairesSoldesReportView,
    DashboardFermeView, DashboardBoutiqueView
)

urlpatterns = [
    path('reporting/tresorerie/', TresorerieReportView.as_view(), name='report-tresorerie'),
    path('reporting/production/', ProductionReportView.as_view(), name='report-production'),
    path('reporting/cout-revient/', CoutRevientReportView.as_view(), name='report-cout-revient'),
    path('reporting/ventes/', VentesReportView.as_view(), name='report-ventes'),
    path('reporting/achats/', AchatsReportView.as_view(), name='report-achats'),
    path('reporting/charges/', ChargesReportView.as_view(), name='report-charges'),
    path('reporting/cofo/', CofoReportView.as_view(), name='report-cofo'),
    path('reporting/veterinaires/', VeterinairesReportView.as_view(), name='report-veterinaires'),
    path('reporting/stock/', StockReportView.as_view(), name='report-stock'),
    path('reporting/partenaires/soldes/', PartenairesSoldesReportView.as_view(), name='report-partenaires-soldes'),
    
    path('reporting/dashboard/ferme/', DashboardFermeView.as_view(), name='dashboard-ferme'),
    path('reporting/dashboard/boutique/<int:pk>/', DashboardBoutiqueView.as_view(), name='dashboard-boutique'),
]

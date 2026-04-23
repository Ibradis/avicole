from django.urls import path
from .views import (
    AchatPDFView, AchatExcelView,
    VentePDFView, VenteExcelView,
    RapportJournalierPDFView, RapportJournalierExcelView,
    TresoreriePDFView, TresorerieExcelView,
    ProductionPDFView, ProductionExcelView,
    CoutRevientPDFView, CoutRevientExcelView,
    VentesRapportPDFView, VentesRapportExcelView,
    AchatsRapportPDFView, AchatsRapportExcelView,
    ChargesPDFView, ChargesExcelView,
    CofoPDFView, CofoExcelView,
    VeterinairesPDFView, VeterinairesExcelView,
    StockRapportPDFView, StockRapportExcelView,
    PartenairesSoldesPDFView, PartenairesSoldesExcelView
)

urlpatterns = [
    # Factures
    path('exports/achats/<int:pk>/pdf/', AchatPDFView.as_view(), name='export-achat-pdf'),
    path('exports/achats/<int:pk>/excel/', AchatExcelView.as_view(), name='export-achat-excel'),
    path('exports/ventes/<int:pk>/pdf/', VentePDFView.as_view(), name='export-vente-pdf'),
    path('exports/ventes/<int:pk>/excel/', VenteExcelView.as_view(), name='export-vente-excel'),

    # Rapport journalier
    path('exports/rapports/<int:pk>/pdf/', RapportJournalierPDFView.as_view(), name='export-rapport-pdf'),
    path('exports/rapports/<int:pk>/excel/', RapportJournalierExcelView.as_view(), name='export-rapport-excel'),

    # Rapports
    path('exports/reporting/tresorerie/pdf/', TresoreriePDFView.as_view(), name='export-rep-tresorerie-pdf'),
    path('exports/reporting/tresorerie/excel/', TresorerieExcelView.as_view(), name='export-rep-tresorerie-excel'),
    
    path('exports/reporting/production/pdf/', ProductionPDFView.as_view(), name='export-rep-production-pdf'),
    path('exports/reporting/production/excel/', ProductionExcelView.as_view(), name='export-rep-production-excel'),
    
    path('exports/reporting/cout-revient/pdf/', CoutRevientPDFView.as_view(), name='export-rep-coutrevient-pdf'),
    path('exports/reporting/cout-revient/excel/', CoutRevientExcelView.as_view(), name='export-rep-coutrevient-excel'),
    
    path('exports/reporting/ventes/pdf/', VentesRapportPDFView.as_view(), name='export-rep-ventes-pdf'),
    path('exports/reporting/ventes/excel/', VentesRapportExcelView.as_view(), name='export-rep-ventes-excel'),
    
    path('exports/reporting/achats/pdf/', AchatsRapportPDFView.as_view(), name='export-rep-achats-pdf'),
    path('exports/reporting/achats/excel/', AchatsRapportExcelView.as_view(), name='export-rep-achats-excel'),
    
    path('exports/reporting/charges/pdf/', ChargesPDFView.as_view(), name='export-rep-charges-pdf'),
    path('exports/reporting/charges/excel/', ChargesExcelView.as_view(), name='export-rep-charges-excel'),
    
    path('exports/reporting/cofo/pdf/', CofoPDFView.as_view(), name='export-rep-cofo-pdf'),
    path('exports/reporting/cofo/excel/', CofoExcelView.as_view(), name='export-rep-cofo-excel'),
    
    path('exports/reporting/veterinaires/pdf/', VeterinairesPDFView.as_view(), name='export-rep-vets-pdf'),
    path('exports/reporting/veterinaires/excel/', VeterinairesExcelView.as_view(), name='export-rep-vets-excel'),
    
    path('exports/reporting/stock/pdf/', StockRapportPDFView.as_view(), name='export-rep-stock-pdf'),
    path('exports/reporting/stock/excel/', StockRapportExcelView.as_view(), name='export-rep-stock-excel'),
    
    path('exports/reporting/partenaires/pdf/', PartenairesSoldesPDFView.as_view(), name='export-rep-partsoldes-pdf'),
    path('exports/reporting/partenaires/excel/', PartenairesSoldesExcelView.as_view(), name='export-rep-partsoldes-excel'),
]

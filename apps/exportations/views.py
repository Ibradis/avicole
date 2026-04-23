# Logique métier et contrôleurs d'API gérant les requêtes HTTP (GET, POST, PATCH, DELETE).
from rest_framework.views import APIView
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from .pdf_generator import generate_pdf
from .excel_generator import generate_excel

class BaseExportPDFView(APIView):
    permission_classes = [IsAuthenticated]
    template_name = 'placeholder.html'
    
    def get_context_data(self, request, pk=None):
        return {"titre": "Export PDF", "data": "Contenu dynamique"}

    @extend_schema(
        summary="Documenter en PDF (Moteur WeasyPrint)",
        description="Délivre un .pdf prêt à être imprimé converti instantanément depuis des Templates HTML par le WeasyPrint Engine.",
        responses={200: bytes}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk=None):
        context = self.get_context_data(request, pk)
        pdf_bytes = generate_pdf(self.template_name, context)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="export.pdf"'
        return response

class BaseExportExcelView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_excel_data(self, request, pk=None):
        return "Export_Title", ["ID", "Valeur"], [[1, "Test 1"], [2, "Test 2"]]

    @extend_schema(
        summary="Documenter en Tableur (Moteur OpenPyXL)",
        description="Génère par le moteur un chiffrier compatible LibreOffice / Excel et force son téléchargement en binaire.",
        responses={200: bytes}
    )
    # Fonction de lecture (GET) retournant une réponse JSON
    def get(self, request, pk=None):
        title, cols, data = self.get_excel_data(request, pk)
        excel_bytes = generate_excel(title, cols, data)
        response = HttpResponse(excel_bytes, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{title}.xlsx"'
        return response

class AchatPDFView(BaseExportPDFView): template_name = 'facture_achat.html'
class AchatExcelView(BaseExportExcelView): pass

class VentePDFView(BaseExportPDFView):
    template_name = 'facture_vente.html'

    def get_context_data(self, request, pk=None):
        from apps.ventes.models import Vente
        from django.shortcuts import get_object_or_404
        vente = get_object_or_404(Vente, pk=pk, organisation=request.user.organisation)
        
        # Détermination du destinataire (Client ou Boutique)
        recipient_name = "Client Divers"
        recipient_contact = ""
        if vente.client:
            recipient_name = vente.client.nom
            recipient_contact = vente.client.telephone or ""
        elif vente.boutique_dest:
            recipient_name = f"Boutique {vente.boutique_dest.nom}"
            recipient_contact = vente.boutique_dest.telephone or ""
            
        return {
            "vente": vente,
            "lignes": vente.lignes.all(),
            "recipient_name": recipient_name,
            "recipient_contact": recipient_contact,
            "organisation": request.user.organisation
        }
class VenteExcelView(BaseExportExcelView): pass

class TresoreriePDFView(BaseExportPDFView): template_name = 'rapport_tresorerie.html'
class TresorerieExcelView(BaseExportExcelView): pass

class ProductionPDFView(BaseExportPDFView): template_name = 'rapport_production.html'
class ProductionExcelView(BaseExportExcelView): pass

class CoutRevientPDFView(BaseExportPDFView): template_name = 'rapport_cout_revient.html'
class CoutRevientExcelView(BaseExportExcelView): pass

class VentesRapportPDFView(BaseExportPDFView): template_name = 'rapport_ventes.html'
class VentesRapportExcelView(BaseExportExcelView): pass

class AchatsRapportPDFView(BaseExportPDFView): template_name = 'rapport_achats.html'
class AchatsRapportExcelView(BaseExportExcelView): pass

class ChargesPDFView(BaseExportPDFView): template_name = 'rapport_charges.html'
class ChargesExcelView(BaseExportExcelView): pass

class CofoPDFView(BaseExportPDFView): template_name = 'rapport_cofo.html'
class CofoExcelView(BaseExportExcelView): pass

class VeterinairesPDFView(BaseExportPDFView): template_name = 'rapport_veterinaires.html'
class VeterinairesExcelView(BaseExportExcelView): pass

class StockRapportPDFView(BaseExportPDFView): template_name = 'rapport_stock.html'
class StockRapportExcelView(BaseExportExcelView): pass

class PartenairesSoldesPDFView(BaseExportPDFView): template_name = 'rapport_partenaires_soldes.html'
class PartenairesSoldesExcelView(BaseExportExcelView): pass

class RapportJournalierPDFView(BaseExportPDFView): template_name = 'rapport_journalier.html'
class RapportJournalierExcelView(BaseExportExcelView): pass

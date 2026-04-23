import weasyprint
from django.template.loader import render_to_string
import tempfile

def generate_pdf(template_name, context):
    """
    Renders an HTML template into a PDF using WeasyPrint.
    Returns the binary content of the PDF.
    """
    html_string = render_to_string(template_name, context)
    html = weasyprint.HTML(string=html_string)
    
    # Generate PDF to a temporary file, then read binary
    result = html.write_pdf()
    return result

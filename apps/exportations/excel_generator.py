from openpyxl import Workbook
import io

def generate_excel(title, columns, data):
    """
    Generates a generic Excel file based on columns and data rows.
    Returns the binary content of the Excel file.
    """
    wb = Workbook()
    ws = wb.active
    ws.title = title

    # Add headers
    ws.append(columns)

    # Add data
    for row in data:
        ws.append(row)

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()

import os
import zipfile
import fitz  # PyMuPDF
import docx

def read_pdf(file_path, num_pages=20):
    text = f"--- PDF: {os.path.basename(file_path)} ---\n"
    try:
        doc = fitz.open(file_path)
        for i in range(min(num_pages, len(doc))):
            text += doc[i].get_text("text") + "\n"
        doc.close()
    except Exception as e:
        text += f"Error reading PDF: {e}\n"
    return text

def read_docx_from_zip(zip_path):
    text = f"--- ZIP: {os.path.basename(zip_path)} ---\n"
    try:
        with zipfile.ZipFile(zip_path, 'r') as z:
            for info in z.infolist():
                if info.filename.endswith('.docx'):
                    try:
                        name = info.filename.encode('cp437').decode('utf-8')
                    except:
                        name = info.filename
                    
                    text += f"\n  --- DOCX: {name} ---\n"
                    with z.open(info.filename) as f:
                        doc = docx.Document(f)
                        for para in doc.paragraphs:
                            text += para.text + "\n"
    except Exception as e:
        text += f"Error reading ZIP/DOCX: {e}\n"
    return text

if __name__ == "__main__":
    folder = r"c:\Users\AYB\Desktop\Whatsapper"
    
    res = "ANALYSIS RESULTS FULL:\n\n"
    
    pdf1 = os.path.join(folder, "Document sans titre (1).pdf")
    if os.path.exists(pdf1):
        res += read_pdf(pdf1) + "\n"
        
    pdf2 = os.path.join(folder, "Document sans titre.pdf")
    if os.path.exists(pdf2):
        res += read_pdf(pdf2) + "\n"
        
    zip_path = os.path.join(folder, "[Fiche Connaissance - Photomaton]-20260327T015318Z-1-001.zip")
    if os.path.exists(zip_path):
        res += read_docx_from_zip(zip_path) + "\n"

    with open(os.path.join(folder, "summary_output_full.txt"), "w", encoding="utf-8") as f:
        f.write(res)

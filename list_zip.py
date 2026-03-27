import zipfile

zip_path = r"c:\Users\AYB\Desktop\Whatsapper\[Fiche Connaissance - Photomaton]-20260327T015318Z-1-001.zip"
try:
    with zipfile.ZipFile(zip_path, 'r') as z:
        for info in z.infolist():
            # Sometimes zip files from windows have specific encoding
            try:
                name = info.filename.encode('cp437').decode('utf-8')
            except:
                name = info.filename
            print(f"- {name}")
except Exception as e:
    print(f"Error reading zip: {e}")

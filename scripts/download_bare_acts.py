import os
import requests
import json

BASE_DIR = r"c:\Users\ARMAN\OneDrive\Desktop\legalai\datasets"
BARE_ACTS_DIR = os.path.join(BASE_DIR, "bare_acts")

# Priority list of Indian Bare Acts with direct PDF links
# Using common public reliable sources like IndiaCode or Department websites
BARE_ACTS = [
    {
        "name": "Indian Penal Code (IPC), 1860",
        "url": "https://lddashboard.legislative.gov.in/sites/default/files/A1860-45.pdf",
        "filename": "Indian_Penal_Code_1860.pdf"
    },
    {
        "name": "Indian Contract Act, 1872",
        "url": "https://lddashboard.legislative.gov.in/sites/default/files/A1872-09.pdf",
        "filename": "Indian_Contract_Act_1872.pdf"
    },
    {
        "name": "Code of Criminal Procedure (CrPC), 1973",
        "url": "https://lddashboard.legislative.gov.in/sites/default/files/A1974-02.pdf",
        "filename": "CrPC_1973.pdf"
    },
    {
        "name": "Code of Civil Procedure (CPC), 1908",
        "url": "https://lddashboard.legislative.gov.in/sites/default/files/A1908-05.pdf",
        "filename": "CPC_1908.pdf"
    },
    {
        "name": "Information Technology Act, 2000",
        "url": "https://lddashboard.legislative.gov.in/sites/default/files/A2000-21.pdf",
        "filename": "IT_Act_2000.pdf"
    },
    {
        "name": "Consumer Protection Act, 2019",
        "url": "https://lddashboard.legislative.gov.in/sites/default/files/A2019-35.pdf",
        "filename": "Consumer_Protection_Act_2019.pdf"
    },
    {
        "name": "Companies Act, 2013",
        "url": "https://lddashboard.legislative.gov.in/sites/default/files/A2013-18.pdf",
        "filename": "Companies_Act_2013.pdf"
    },
    {
        "name": "Hindu Marriage Act, 1955",
        "url": "https://lddashboard.legislative.gov.in/sites/default/files/A1955-25.pdf",
        "filename": "Hindu_Marriage_Act_1955.pdf"
    },
    {
        "name": "Right to Information Act, 2005",
        "url": "https://lddashboard.legislative.gov.in/sites/default/files/A2005-22.pdf",
        "filename": "RTI_Act_2005.pdf"
    },
    {
        "name": "Prevention of Corruption Act, 1988",
        "url": "https://lddashboard.legislative.gov.in/sites/default/files/A1988-49.pdf",
        "filename": "Prevention_of_Corruption_Act_1988.pdf"
    }
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
}

def download_acts():
    print("Starting Bare Acts download...")
    os.makedirs(BARE_ACTS_DIR, exist_ok=True)
    count = 0
    
    for act in BARE_ACTS:
        filepath = os.path.join(BARE_ACTS_DIR, act["filename"])
        if os.path.exists(filepath):
            print(f"Skipping {act['name']} - already exists")
            count += 1
            continue
            
        print(f"Downloading {act['name']}...")
        try:
            r = requests.get(act["url"], headers=headers, timeout=30)
            if r.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(r.content)
                print(f"  -> Saved as {act['filename']}")
                count += 1
            else:
                print(f"  -> Failed: Status Code {r.status_code}")
        except Exception as e:
            print(f"  -> Error: {str(e)}")
            
    # Add a metadata manifest
    manifest_path = os.path.join(BARE_ACTS_DIR, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(BARE_ACTS, f, indent=4)
        
    print(f"Completed Bare Acts: {count}/{len(BARE_ACTS)} downloaded.")

if __name__ == "__main__":
    download_acts()

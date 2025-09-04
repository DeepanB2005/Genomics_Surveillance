from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from xml.etree import ElementTree as ET

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

NCBI_EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

@app.get("/analyze/{genomic_id}")
async def analyze(genomic_id: str):
    # Query NCBI Entrez for nucleotide record
    params = {
        "db": "nucleotide",
        "id": genomic_id,
        "rettype": "gb",
        "retmode": "xml"
    }
    response = requests.get(NCBI_EFETCH_URL, params=params)

    if response.status_code != 200 or not response.text.strip():
        raise HTTPException(status_code=404, detail=f"Genomic ID {genomic_id} not found in NCBI")

    # Parse XML to extract organism name
    try:
        root = ET.fromstring(response.text)
        organism = root.findtext(".//GBSeq_organism")
        if not organism:
            organism = "Unknown organism"
    except ET.ParseError:
        organism = "Unknown organism"

    # Simple pathogen heuristic (extendable with PHI-base/AMRFinder)
    is_pathogen = any(word in organism.lower() for word in ["virus", "bacterium", "plasmid", "pathogen"])
    danger = "High" if "virus" in organism.lower() else ("Medium" if is_pathogen else "Low")

    return {
        "genomic_id": genomic_id,
        "organism": organism,
        "is_pathogen": is_pathogen,
        "danger_level": danger
    }

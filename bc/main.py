from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Example pathogen database (can be expanded)
pathogen_db = {
    "NC_045512": {"name": "SARS-CoV-2", "is_pathogen": True, "danger": "High"},
    "NC_000913": {"name": "Escherichia coli K-12", "is_pathogen": False, "danger": "Low"},
    "NC_006273": {"name": "MERS-CoV", "is_pathogen": True, "danger": "High"},
}

@app.get("/check_genome")
def check_genome(genome_id: str = Query(..., description="Genomic accession ID")):
    # Step 1: Query NCBI for basic info (simplified example)
    ncbi_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nucleotide&id={genome_id}&retmode=json"
    response = requests.get(ncbi_url)
    if response.status_code == 200:
        data = response.json()
        title = data.get("result", {}).get(genome_id, {}).get("title", "Unknown organism")
    else:
        title = "Unknown organism"

    # Step 2: Match with local pathogen database
    result = pathogen_db.get(genome_id, {
        "name": title,
        "is_pathogen": "Unknown",
        "danger": "Unknown"
    })

    return {
        "genome_id": genome_id,
        "organism": result["name"],
        "is_pathogen": result["is_pathogen"],
        "danger_level": result["danger"]
    }

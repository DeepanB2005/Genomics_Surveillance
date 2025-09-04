from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from xml.etree import ElementTree as ET
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

NCBI_EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

# Gemini setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or "AIzaSyDqr6OpLmEaKNZBINb_k8fpDWSs54QVVAI"  # fallback to hardcoded key if env not set
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

def query_gemini(genomic_id: str):
    prompt = f"Provide organism and pathogen information for genomic accession: {genomic_id}."
    try:
        response = requests.post(API_URL, headers={"Content-Type": "application/json"}, json={"contents": [{"parts": [{"text": prompt}]}]})
        if response.status_code == 200:
            gemini_data = response.json()
            # Extract the generated text from the Gemini API response
            text = gemini_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return {"genomic_id": genomic_id, "gemini_response": text or "No response text."}
        else:
            return {"error": f"Gemini API error: {response.status_code} {response.text}"}
    except Exception as e:
        return {"error": f"Gemini request failed: {str(e)}"}

def generate_gemini_report(result: dict):
    prompt = (
        "Generate a simple, clear report for the following genomic analysis result:\n"
        f"{result}\n"
        "Summarize the organism, pathogen status, and danger level in plain English."
    )
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }
    try:
        response = requests.post(API_URL, headers=headers, json=data)
        if response.status_code == 200:
            gemini_data = response.json()
            # Extract the generated text from the Gemini API response
            text = gemini_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return text or "No report generated."
        else:
            return f"Gemini API error: {response.status_code} {response.text}"
    except Exception as e:
        return f"Gemini report generation failed: {str(e)}"

@app.get("/analyze/{genomic_id}")
async def analyze(genomic_id: str):
    params = {
        "db": "nucleotide",
        "id": genomic_id,
        "rettype": "gb",
        "retmode": "xml"
    }
    try:
        response = requests.get(NCBI_EFETCH_URL, params=params)
    except Exception as e:
        result = query_gemini(genomic_id)
        report = generate_gemini_report(result)
        return {**result, "report": report}

    if response.status_code != 200 or not response.text.strip():
        result = query_gemini(genomic_id)
        report = generate_gemini_report(result)
        return {**result, "report": report}

    try:
        root = ET.fromstring(response.text)
        organism = root.findtext(".//GBSeq_organism")
        if not organism:
            organism = "Unknown organism"
    except ET.ParseError:
        organism = "Unknown organism"

    is_pathogen = any(word in organism.lower() for word in ["virus", "bacterium", "plasmid", "pathogen"])
    danger = "High" if "virus" in organism.lower() else ("Medium" if is_pathogen else "Low")

    result = {
        "genomic_id": genomic_id,
        "organism": organism,
        "is_pathogen": is_pathogen,
        "danger_level": danger
    }
    report = generate_gemini_report(result)
    return {**result, "report": report}
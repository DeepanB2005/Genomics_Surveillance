# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# Allow frontend requests (CORS setup)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow only your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTBREAK_API = "https://api.outbreak.info/genomics/prevalence-by-location"

@app.get("/variant-trends/{variant}")
def get_variant_trends(variant: str):
    """
    Fetch prevalence trends for a SARS-CoV-2 variant
    Example: B.1.1.7 (Alpha), BA.5, XBB.1.5
    """
    params = {
        "pangolin_lineage": variant,
        "location": "USA",   # you can make this dynamic later
    }
    try:
        response = requests.get(OUTBREAK_API, params=params)
        if response.status_code == 200:
            try:
                data = response.json()
                if "data" in data:
                    return {"data": data["data"]}
                else:
                    return {"error": "No data found for the specified variant"}
            except requests.exceptions.JSONDecodeError:
                return {"error": "Invalid JSON response from the API"}
        else:
            return {"error": f"API returned status code {response.status_code}", "details": response.text}
    except requests.RequestException as e:
        return {"error": "Failed to fetch data from the API", "details": str(e)}

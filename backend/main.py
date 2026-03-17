from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import httpx

from data import fetch_driver_standings, fetch_last_n_results

load_dotenv()

app = FastAPI(title="Turn3 F1 Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Turn3 F1 Predictor API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/standings")
def get_standings():
    try:
        return fetch_driver_standings()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Upstream API error: {e}")


@app.get("/results/recent")
def get_recent_results(n: int = 5):
    try:
        return fetch_last_n_results(n)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Upstream API error: {e}")

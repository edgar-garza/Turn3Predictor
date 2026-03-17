from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import httpx

from data import (
    fetch_driver_standings,
    fetch_constructor_standings,
    fetch_last_n_results,
    fetch_race_schedule,
    fetch_circuit_history,
    fetch_circuit_all_results,
)
from formatter import build_prediction_context
from ai import generate_prediction

load_dotenv()

app = FastAPI(title="Turn3 F1 Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",  # any localhost port (dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _handle_data_error(e: Exception):
    """T-014 — centralised error handling for upstream API failures."""
    if isinstance(e, httpx.TimeoutException):
        raise HTTPException(status_code=504, detail="F1 data API timed out. Try again.")
    if isinstance(e, httpx.HTTPStatusError):
        if e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="F1 data API rate limit hit. Try again shortly.")
        raise HTTPException(status_code=502, detail=f"F1 data API error: {e.response.status_code}")
    raise HTTPException(status_code=502, detail=f"Upstream error: {str(e)}")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "Turn3 F1 Predictor API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/schedule")
def get_schedule():
    """Return the full current season race calendar."""
    try:
        return fetch_race_schedule()
    except Exception as e:
        _handle_data_error(e)


@app.get("/standings")
def get_standings():
    """Return current driver championship standings."""
    try:
        return fetch_driver_standings()
    except Exception as e:
        _handle_data_error(e)


@app.get("/results/recent")
def get_recent_results(n: int = Query(default=5, ge=1, le=10)):
    """Return the last N completed race results."""
    try:
        return fetch_last_n_results(n)
    except Exception as e:
        _handle_data_error(e)


@app.get("/predict/{circuit_id}")
def predict(
    circuit_id: str,
    weather: str = Query(default="dry", pattern="^(dry|wet|mixed)$"),
):
    """
    T-018 — Generate an AI race prediction for the given circuit.

    circuit_id : Jolpica circuit ID (e.g. albert_park, monaco, bahrain)
    weather    : Expected race conditions — dry | wet | mixed  (T-036)
    """
    # 1. Fetch all context data
    try:
        schedule = fetch_race_schedule()
        standings = fetch_driver_standings()
        constructor_standings = fetch_constructor_standings()
        recent_results = fetch_last_n_results(5)
        circuit_history = fetch_circuit_history(circuit_id, limit=10)
        circuit_driver_results = fetch_circuit_all_results(circuit_id, limit=3)
    except Exception as e:
        _handle_data_error(e)

    # 2. Find race info from schedule
    race_info = next(
        (r for r in schedule if r["circuit_id"] == circuit_id), None
    )
    if race_info is None:
        raise HTTPException(
            status_code=404,
            detail=f"Circuit '{circuit_id}' not found in this season's schedule."
        )

    # 3. Build context string and call Claude
    context = build_prediction_context(
        standings, constructor_standings, recent_results,
        circuit_history, circuit_driver_results, race_info,
        weather=weather,
    )

    try:
        prediction = generate_prediction(context, race_info["race"])
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI prediction error: {str(e)}")

    return prediction

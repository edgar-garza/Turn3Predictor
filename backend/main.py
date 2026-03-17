from fastapi import FastAPI, HTTPException, Query, Request
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
import asyncio
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
from database import log_prediction, get_cached_prediction, get_history, cast_vote, get_votes, add_comment, get_comments

load_dotenv()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Turn3 F1 Predictor API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+|https://.*\.vercel\.app|https://turn3predictor\.com",
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
@limiter.limit("10/hour")
async def predict(
    request: Request,
    circuit_id: str,
    weather: str = Query(default="dry", pattern="^(dry|wet|mixed)$"),
):
    """
    T-018 — Generate an AI race prediction for the given circuit.

    circuit_id : Jolpica circuit ID (e.g. albert_park, monaco, bahrain)
    weather    : Expected race conditions — dry | wet | mixed  (T-036)
    """
    # 1. Fetch all context data in parallel — cuts serial API call latency
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        try:
            (
                schedule,
                standings,
                constructor_standings,
                recent_results,
                circuit_history,
                circuit_driver_results,
            ) = await asyncio.gather(
                loop.run_in_executor(pool, fetch_race_schedule),
                loop.run_in_executor(pool, fetch_driver_standings),
                loop.run_in_executor(pool, fetch_constructor_standings),
                loop.run_in_executor(pool, lambda: fetch_last_n_results(5)),
                loop.run_in_executor(pool, lambda: fetch_circuit_history(circuit_id, 10)),
                loop.run_in_executor(pool, lambda: fetch_circuit_all_results(circuit_id, 3)),
            )
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

    # 3. Cache lookup — round_count = number of completed races so far this season
    round_count = sum(1 for r in recent_results) if recent_results else 0
    try:
        cached = get_cached_prediction(circuit_id, weather, 2026, round_count)
        if cached:
            print(f"[cache] hit — {circuit_id} weather={weather} round_count={round_count}")
            return cached
    except Exception as e:
        print(f"[cache] lookup failed: {e}")

    # 4. Build context string and call Claude
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

    # T-039 — log prediction to Supabase (non-blocking: failure won't break the response)
    try:
        log_prediction(
            season=2026,
            round=int(race_info["round"]),
            race_name=race_info["race"],
            circuit_id=circuit_id,
            weather=weather,
            prediction=prediction,
            round_count=round_count,
        )
    except Exception as e:
        print(f"[db] Failed to log prediction: {e}")

    return prediction


@app.get("/debug/cache/{circuit_id}")
def debug_cache(circuit_id: str, weather: str = "dry", season: int = 2026):
    """Temporary debug endpoint — shows cache state and tests insert."""
    from data import fetch_last_n_results
    from database import get_client
    recent = fetch_last_n_results(5)
    round_count = len(recent)
    cached = get_cached_prediction(circuit_id, weather, season, round_count)

    # Test insert with a dummy row to surface the real error
    insert_error = None
    try:
        get_client().table("predictions").insert({
            "season": season,
            "round": 99,
            "race_name": "_debug_",
            "circuit_id": "_debug_",
            "weather": "dry",
            "p1_driver": "x", "p1_code": "x", "p1_constructor": "x",
            "p2_driver": "x", "p2_code": "x", "p2_constructor": "x",
            "p3_driver": "x", "p3_code": "x", "p3_constructor": "x",
            "confidence": 1,
            "reasoning": "debug",
            "round_count": round_count,
        }).execute()
        insert_error = "insert succeeded"
        # Clean up
        get_client().table("predictions").delete().eq("circuit_id", "_debug_").execute()
    except Exception as e:
        insert_error = str(e)

    rows = (
        get_client()
        .table("predictions")
        .select("circuit_id,weather,season,round_count,created_at")
        .eq("circuit_id", circuit_id)
        .eq("season", season)
        .execute()
        .data
    )
    return {
        "round_count": round_count,
        "cache_hit": cached is not None,
        "insert_test": insert_error,
        "db_rows": rows,
    }


@app.get("/history")
def history(season: int = 2026):
    """T-042 — Return all predictions with accuracy scores where results exist."""
    try:
        return get_history(season)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History error: {str(e)}")


class VoteBody(BaseModel):
    vote: str = Field(..., pattern="^(agree|disagree)$")


class CommentBody(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


# ── Votes ─────────────────────────────────────────────────────────────────────

@app.get("/votes/{circuit_id}")
def read_votes(circuit_id: str, request: Request, season: int = 2026):
    """Return agree/disagree counts and the caller's existing vote."""
    try:
        ip = request.client.host
        return get_votes(circuit_id, season, ip)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Votes error: {str(e)}")


@app.post("/votes/{circuit_id}")
@limiter.limit("20/hour")
def submit_vote(circuit_id: str, body: VoteBody, request: Request, season: int = 2026):
    """Cast or change a vote for a circuit prediction."""
    try:
        ip = request.client.host
        return cast_vote(circuit_id, season, ip, body.vote)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vote error: {str(e)}")


# ── Comments ──────────────────────────────────────────────────────────────────

@app.get("/comments/{circuit_id}")
def read_comments(circuit_id: str, season: int = 2026):
    """Return all comments for a circuit prediction."""
    try:
        return get_comments(circuit_id, season)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comments error: {str(e)}")


@app.post("/comments/{circuit_id}")
@limiter.limit("5/hour")
def post_comment(circuit_id: str, body: CommentBody, request: Request, season: int = 2026):
    """Post a comment on a circuit prediction."""
    try:
        return add_comment(circuit_id, season, body.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comment error: {str(e)}")


@app.get("/stats")
def stats(season: int = 2026):
    """T-044 — Season accuracy summary stats."""
    try:
        entries = get_history(season)
        scored = [e for e in entries if e["status"] == "scored"]
        if not scored:
            return {"season": season, "predictions": len(entries), "scored": 0, "avg_score": None, "avg_pct": None}

        avg_score = round(sum(e["score"]["score"] for e in scored) / len(scored), 2)
        avg_pct = round(sum(e["score"]["percentage"] for e in scored) / len(scored))
        perfect = sum(1 for e in scored if e["score"]["score"] == 6)

        return {
            "season": season,
            "predictions": len(entries),
            "scored": len(scored),
            "avg_score": avg_score,
            "avg_pct": avg_pct,
            "perfect_predictions": perfect,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats error: {str(e)}")

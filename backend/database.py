"""
Supabase database layer for Turn3 F1 Predictor.

Tables:
  predictions — every AI prediction generated
  results     — actual race results (manually entered after each race)
"""

import os
from supabase import create_client, Client

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_KEY"]
        _client = create_client(url, key)
    return _client


# ── Predictions ───────────────────────────────────────────────────────────────

def log_prediction(
    season: int,
    round: int,
    race_name: str,
    circuit_id: str,
    weather: str,
    prediction: dict,
) -> dict:
    """
    T-039 — Insert a prediction into the predictions table.
    Returns the inserted row.
    """
    podium = prediction["podium"]
    row = {
        "season": season,
        "round": round,
        "race_name": race_name,
        "circuit_id": circuit_id,
        "weather": weather,
        "p1_driver": podium["P1"]["driver"],
        "p1_code": podium["P1"]["code"],
        "p1_constructor": podium["P1"]["constructor"],
        "p2_driver": podium["P2"]["driver"],
        "p2_code": podium["P2"]["code"],
        "p2_constructor": podium["P2"]["constructor"],
        "p3_driver": podium["P3"]["driver"],
        "p3_code": podium["P3"]["code"],
        "p3_constructor": podium["P3"]["constructor"],
        "confidence": prediction["confidence"],
        "reasoning": prediction["reasoning"],
    }
    result = get_client().table("predictions").insert(row).execute()
    return result.data[0] if result.data else row


def get_predictions(season: int | None = None) -> list[dict]:
    """Fetch all predictions, optionally filtered by season."""
    query = get_client().table("predictions").select("*").order("round")
    if season:
        query = query.eq("season", season)
    return query.execute().data


# ── Results ───────────────────────────────────────────────────────────────────

def get_results(season: int | None = None) -> list[dict]:
    """Fetch all actual race results, optionally filtered by season."""
    query = get_client().table("results").select("*").order("round")
    if season:
        query = query.eq("season", season)
    return query.execute().data


# ── Accuracy scoring (T-041) ──────────────────────────────────────────────────

def score_prediction(prediction: dict, result: dict) -> dict:
    """
    T-041 — Compare a prediction to an actual result.

    Scoring:
      - Exact P1 match : 3 pts
      - Exact P2 match : 2 pts
      - Exact P3 match : 1 pt
      - Driver on podium but wrong position : 0.5 pts
    Max score: 6 pts

    Returns a score dict with breakdown and percentage.
    """
    pred_codes = {
        "P1": prediction["p1_code"],
        "P2": prediction["p2_code"],
        "P3": prediction["p3_code"],
    }
    actual_codes = {
        "P1": result["p1_code"],
        "P2": result["p2_code"],
        "P3": result["p3_code"],
    }
    actual_set = set(actual_codes.values())

    exact_weights = {"P1": 3, "P2": 2, "P3": 1}
    score = 0.0
    breakdown = {}

    for pos, code in pred_codes.items():
        if code == actual_codes[pos]:
            pts = exact_weights[pos]
            breakdown[pos] = {"result": "exact", "points": pts}
            score += pts
        elif code in actual_set:
            breakdown[pos] = {"result": "wrong_position", "points": 0.5}
            score += 0.5
        else:
            breakdown[pos] = {"result": "miss", "points": 0}

    return {
        "score": score,
        "max_score": 6,
        "percentage": round((score / 6) * 100),
        "breakdown": breakdown,
    }


def get_history(season: int = 2026) -> list[dict]:
    """
    T-042 — Return predictions merged with actual results and accuracy scores.
    Predictions without a matching result are marked as pending.
    """
    predictions = get_predictions(season)
    results = {r["round"]: r for r in get_results(season)}

    history = []
    for pred in predictions:
        entry = {
            "round": pred["round"],
            "race_name": pred["race_name"],
            "circuit_id": pred["circuit_id"],
            "weather": pred["weather"],
            "created_at": pred["created_at"],
            "prediction": {
                "P1": {"driver": pred["p1_driver"], "code": pred["p1_code"], "constructor": pred["p1_constructor"]},
                "P2": {"driver": pred["p2_driver"], "code": pred["p2_code"], "constructor": pred["p2_constructor"]},
                "P3": {"driver": pred["p3_driver"], "code": pred["p3_code"], "constructor": pred["p3_constructor"]},
            },
            "confidence": pred["confidence"],
            "reasoning": pred["reasoning"],
            "status": "pending",
            "actual": None,
            "score": None,
        }

        if pred["round"] in results:
            result = results[pred["round"]]
            entry["status"] = "scored"
            entry["actual"] = {
                "P1": {"driver": result["p1_driver"], "code": result["p1_code"], "constructor": result["p1_constructor"]},
                "P2": {"driver": result["p2_driver"], "code": result["p2_code"], "constructor": result["p2_constructor"]},
                "P3": {"driver": result["p3_driver"], "code": result["p3_code"], "constructor": result["p3_constructor"]},
            }
            entry["score"] = score_prediction(pred, result)

        history.append(entry)

    return history

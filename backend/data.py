"""
Data fetching functions for Turn3 F1 Predictor.
Uses the Jolpica F1 API (drop-in Ergast replacement).
Base URL: https://api.jolpi.ca/ergast/f1/
Rate limits: 4 req/sec burst, 500 req/hr sustained — no auth required.

Endpoints used:
  Driver standings   : /current/driverstandings.json
  Race results       : /current/results.json
  Race schedule      : /current.json
  Circuit history    : /circuits/{circuitId}/results/1.json  (winners only)
"""

import httpx

BASE_URL = "https://api.jolpi.ca/ergast/f1"


def _get(url: str) -> dict:
    """Shared HTTP GET with timeout and error propagation."""
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    return response.json()


def fetch_driver_standings() -> list[dict]:
    """
    Fetch current season driver championship standings.

    Returns:
        [{"position", "driver", "code", "constructor", "points", "wins"}, ...]
    """
    data = _get(f"{BASE_URL}/current/driverstandings.json")
    standings_lists = data["MRData"]["StandingsTable"]["StandingsLists"]

    if not standings_lists:
        return []

    return [
        {
            "position": e["position"],
            "driver": f"{e['Driver']['givenName']} {e['Driver']['familyName']}",
            "code": e["Driver"]["code"],
            "constructor": e["Constructors"][0]["name"],
            "points": e["points"],
            "wins": e["wins"],
        }
        for e in standings_lists[0]["DriverStandings"]
    ]


def fetch_last_n_results(n: int = 5) -> list[dict]:
    """
    Fetch results from the last N completed races of the current season.

    Returns:
        [{"round", "race", "circuit", "date",
          "results": [{"position", "driver", "constructor", "points", "status"}]}, ...]
    """
    data = _get(f"{BASE_URL}/current/results.json?limit=100")
    races = data["MRData"]["RaceTable"]["Races"]
    recent = races[-n:] if len(races) >= n else races

    return [
        {
            "round": race["round"],
            "race": race["raceName"],
            "circuit": race["Circuit"]["circuitName"],
            "date": race["date"],
            "results": [
                {
                    "position": r["position"],
                    "driver": r["Driver"]["code"],
                    "constructor": r["Constructor"]["name"],
                    "points": r["points"],
                    "status": r["status"],
                }
                for r in race.get("Results", [])
            ],
        }
        for race in recent
    ]


def fetch_race_schedule() -> list[dict]:
    """
    Fetch the full current season race calendar.

    Returns:
        [{"round", "race", "circuit_id", "circuit", "country", "date", "time"}, ...]
    """
    data = _get(f"{BASE_URL}/current.json")
    races = data["MRData"]["RaceTable"]["Races"]

    return [
        {
            "round": race["round"],
            "race": race["raceName"],
            "circuit_id": race["Circuit"]["circuitId"],
            "circuit": race["Circuit"]["circuitName"],
            "country": race["Circuit"]["Location"]["country"],
            "date": race["date"],
            "time": race.get("time", "TBA"),
        }
        for race in races
    ]


def fetch_circuit_history(circuit_id: str, limit: int = 10) -> list[dict]:
    """
    Fetch historical race winners at a specific circuit (most recent first).

    Args:
        circuit_id: Jolpica circuit ID (e.g. "albert_park", "monaco", "bahrain")
        limit: Number of past races to return

    Returns:
        [{"season", "race", "winner", "constructor", "laps", "time"}, ...]
    """
    # Fetch a large batch and slice the last N — API returns oldest first
    data = _get(f"{BASE_URL}/circuits/{circuit_id}/results/1.json?limit=100")
    races = data["MRData"]["RaceTable"]["Races"]
    recent_races = races[-limit:]  # last N = most recent

    history = []
    for race in reversed(recent_races):  # most recent first
        result = race["Results"][0]
        history.append({
            "season": race["season"],
            "race": race["raceName"],
            "winner": f"{result['Driver']['givenName']} {result['Driver']['familyName']}",
            "code": result["Driver"]["code"],
            "constructor": result["Constructor"]["name"],
            "laps": result["laps"],
            "time": result.get("Time", {}).get("time", "N/A"),
        })
    return history

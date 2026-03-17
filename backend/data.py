"""
Data fetching functions for Turn3 F1 Predictor.
Uses the Jolpica F1 API (drop-in Ergast replacement).
Base URL: https://api.jolpi.ca/ergast/f1/
Rate limits: 4 req/sec burst, 500 req/hr sustained — no auth required.

Endpoints used:
  Driver standings : /current/driverstandings.json
  Race results     : /current/results.json
  Race schedule    : /current.json
  Circuit data     : /circuits/{circuitId}.json
"""

import httpx

BASE_URL = "https://api.jolpi.ca/ergast/f1"


def fetch_driver_standings() -> list[dict]:
    """
    Fetch the current season driver championship standings.

    Returns a list of dicts, e.g.:
    [
      {"position": "1", "driver": "Max Verstappen", "code": "VER",
       "constructor": "Red Bull", "points": "77", "wins": "3"},
      ...
    ]
    """
    url = f"{BASE_URL}/current/driverstandings.json"
    response = httpx.get(url, timeout=10)
    response.raise_for_status()

    standings_list = (
        response.json()
        ["MRData"]["StandingsTable"]["StandingsLists"]
    )

    if not standings_list:
        return []

    drivers = []
    for entry in standings_list[0]["DriverStandings"]:
        drivers.append({
            "position": entry["position"],
            "driver": f"{entry['Driver']['givenName']} {entry['Driver']['familyName']}",
            "code": entry["Driver"]["code"],
            "constructor": entry["Constructors"][0]["name"],
            "points": entry["points"],
            "wins": entry["wins"],
        })
    return drivers


def fetch_last_n_results(n: int = 5) -> list[dict]:
    """
    Fetch results from the last N completed races of the current season.

    Returns a list of race result dicts, e.g.:
    [
      {
        "round": "3",
        "race": "Australian Grand Prix",
        "circuit": "Albert Park",
        "date": "2025-03-23",
        "results": [
          {"position": "1", "driver": "VER", "constructor": "Red Bull", "points": "25"},
          ...
        ]
      },
      ...
    ]
    """
    url = f"{BASE_URL}/current/results.json?limit=100"
    response = httpx.get(url, timeout=10)
    response.raise_for_status()

    races = response.json()["MRData"]["RaceTable"]["Races"]

    # Take the last n completed races
    recent = races[-n:] if len(races) >= n else races

    results = []
    for race in recent:
        top_results = []
        for r in race.get("Results", []):
            top_results.append({
                "position": r["position"],
                "driver": r["Driver"]["code"],
                "constructor": r["Constructor"]["name"],
                "points": r["points"],
                "status": r["status"],
            })
        results.append({
            "round": race["round"],
            "race": race["raceName"],
            "circuit": race["Circuit"]["circuitName"],
            "date": race["date"],
            "results": top_results,
        })
    return results

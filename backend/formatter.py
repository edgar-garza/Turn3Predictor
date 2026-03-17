"""
Data formatter for prediction prompts.

Converts raw API data into a structured plain-text context block
injected into the Claude prompt.

Data inputs (T-032):
  1. Driver championship standings
  2. Constructor championship standings  (T-035)
  3. Last 5 race results + driver form   (T-033)
  4. Circuit winner history
  5. Circuit full results (per-driver)   (T-034)
  6. Upcoming race info
"""


# Chaos ratings derived from OpenF1 race_control data (2023–2025 seasons).
# SC Score = (physical SC deployments × 2) + (VSC deployments × 1), summed across 3 seasons.
# HIGH ≥ 8  |  MEDIUM 3–7  |  LOW ≤ 2
# Revisit each season with fresh OpenF1 data.
_CHAOS: dict[str, tuple[str, str]] = {
    # HIGH (score ≥ 8)
    "albert_park":  ("HIGH",   "Australia is the most SC-prone circuit on the calendar — 15 pts over 3 seasons. Race outcome regularly decided by safety car timing, not pace."),
    "losail":       ("HIGH",   "Qatar averages 3–4 safety cars per race (11 pts over 3 seasons). Expect at least one SC. Strategy and track position at restart are decisive."),
    "interlagos":   ("HIGH",   "Brazil consistently produces SCs (10 pts over 3 seasons). Wet conditions amplify chaos further — treat any driver form with a chaos discount."),
    "villeneuve":   ("HIGH",   "Canada is wall-lined and punishing — 9 pts over 3 seasons. One mistake ends races. Reliability and avoiding incidents matters as much as pace."),
    "silverstone":  ("HIGH",   "Silverstone moved to HIGH in 2025 (8 pts over 3 seasons). High-speed incidents at Copse/Maggots can neutralise a dominant car."),
    "zandvoort":    ("HIGH",   "Zandvoort jumped to HIGH in 2025 (8 pts over 3 seasons). Narrow circuit with limited overtaking — SC restarts are a major equaliser."),
    # MEDIUM (score 3–7)
    "vegas":        ("MEDIUM", "Street circuit with SC history (7 pts). Night race adds unpredictability. Expect one SC but unlikely to dominate the race outcome."),
    "rodriguez":    ("MEDIUM", "6 pts over 3 seasons. High altitude affects deg and strategy. SC possible — especially at turn 1 at the start."),
    "red_bull_ring":("MEDIUM", "Short lap means SC laps have outsized strategy impact (6 pts). One VSC can completely reset tyre windows."),
    "jeddah":       ("MEDIUM", "6 pts over 3 seasons. High-speed walls make incidents possible, but 2024–2025 were cleaner than early seasons suggested."),
    "suzuka":       ("MEDIUM", "5 pts over 3 seasons but 2025 was clean. Technical circuit — when incidents happen they tend to be significant."),
    "miami":        ("MEDIUM", "5 pts. Street-style layout with VSC tendency. Moderate disruption risk."),
    "baku":         ("MEDIUM", "5 pts. Notorious reputation but data shows MEDIUM over 3 seasons. Do not over-weight street circuit mythology — pace matters more than chaos here recently."),
    "shanghai":     ("MEDIUM", "5 pts but only 2 seasons of data (returned 2024). Treat as MEDIUM pending more history."),
    "imola":        ("MEDIUM", "3 pts. Jumped from LOW — 2025 brought SC and VSC. Narrow circuit with limited run-off makes incidents more likely than the old data suggested."),
    "marina_bay":   ("MEDIUM", "3 pts. Reputation exceeds recent data — 2024–2025 were clean. Track position matters at this circuit but SC risk is lower than assumed."),
    "monaco":       ("MEDIUM", "3 pts. Reputation for chaos but recent races have been clean. VSC more likely than full SC. Track position is everything here."),
    "americas":     ("MEDIUM", "3 pts. COTA is generally clean but not immune. VSC more likely than full SC."),
    "bahrain":      ("MEDIUM", "3 pts. Wide circuit usually produces clean races but SC risk is now real based on recent seasons."),
    # LOW (score ≤ 2)
    "spa":          ("LOW",    "2 pts. Despite weather wildcard, 2023–2025 data shows consistently low SC activity. Weather is the main variable, not circuit-induced incidents."),
    "catalunya":    ("LOW",    "2 pts. One SC in 2025 (first in 3 seasons). Generally clean and processional. Pace and strategy dominate."),
    "yas_marina":   ("LOW",    "1 pt. Abu Dhabi is typically processional. Very low SC risk. Tyre strategy and pace are the primary differentiators."),
    "hungaroring":  ("LOW",    "0 pts across 3 seasons. No SC events. Clean, slow-speed circuit — position at lap 1 turn 1 matters more than safety car luck."),
    "monza":        ("LOW",    "0 pts across 3 seasons. Temple of Speed is consistently clean. Slipstream and DRS battles decide outcomes, not safety cars."),
}


def format_chaos(circuit_id: str) -> str:
    """Inject circuit chaos/safety car context derived from OpenF1 data."""
    if circuit_id not in _CHAOS:
        return ""
    level, note = _CHAOS[circuit_id]
    return f"CIRCUIT CHAOS FACTOR: {level}\n  {note}"


def format_race_info(race: dict) -> str:
    return (
        f"UPCOMING RACE:\n"
        f"  Name    : {race['race']}\n"
        f"  Circuit : {race['circuit']}\n"
        f"  Country : {race['country']}\n"
        f"  Date    : {race['date']}\n"
        f"  Round   : {race['round']} of the current season"
    )


def format_standings(standings: list[dict]) -> str:
    lines = ["DRIVER CHAMPIONSHIP STANDINGS (current season):"]
    for d in standings[:10]:
        lines.append(
            f"  P{d['position']}. {d['driver']} ({d['code']}) — "
            f"{d['constructor']} — {d['points']} pts, {d['wins']} wins"
        )
    return "\n".join(lines)


def format_constructor_standings(standings: list[dict]) -> str:
    """T-035 — constructor championship context."""
    if not standings:
        return "CONSTRUCTOR STANDINGS: Not yet available."
    lines = ["CONSTRUCTOR CHAMPIONSHIP STANDINGS:"]
    for c in standings[:8]:
        lines.append(
            f"  P{c['position']}. {c['constructor']} — {c['points']} pts, {c['wins']} wins"
        )
    return "\n".join(lines)


def format_recent_results(results: list[dict]) -> str:
    """T-033 — recent race results with implicit driver form."""
    if not results:
        return "RECENT RACE RESULTS: No completed races yet this season."

    sections = ["RECENT RACE RESULTS (newest first):"]
    for race in reversed(results):
        sections.append(f"\n  {race['race']} (Round {race['round']}, {race['date']}):")
        for r in race["results"][:5]:
            sections.append(f"    P{r['position']}. {r['driver']} ({r['constructor']})")
    return "\n".join(sections)


def format_driver_form(results: list[dict]) -> str:
    """
    T-033 — Derive each driver's last-N finishing positions from recent results.
    Groups results by driver code and shows their positional trend.
    """
    if not results:
        return ""

    # Build {code: [positions]} ordered newest-first
    form: dict[str, list[str]] = {}
    for race in reversed(results):
        for r in race["results"]:
            code = r["driver"]
            if code not in form:
                form[code] = []
            form[code].append(r["position"] if r["status"] == "Finished" else "DNF")

    # Only show drivers with at least one classified finish — drops pure-DNF noise
    lines = ["DRIVER FORM (last races, most recent → oldest):"]
    for code, positions in sorted(form.items(), key=lambda x: int(x[1][0]) if x[1][0].isdigit() else 99):
        if any(p.isdigit() for p in positions):
            lines.append(f"  {code}: {' → '.join(positions)}")
    return "\n".join(lines)


def format_circuit_history(history: list[dict], circuit: str) -> str:
    if not history:
        return f"CIRCUIT WINNER HISTORY ({circuit}): No data available."

    lines = [f"CIRCUIT WINNER HISTORY — {circuit} (most recent first):"]
    for h in history:
        lines.append(f"  {h['season']}: {h['winner']} ({h['constructor']})")
    return "\n".join(lines)


def format_circuit_driver_results(circuit_results: list[dict], circuit: str) -> str:
    """T-034 — per-driver performance at this specific circuit."""
    if not circuit_results:
        return f"CIRCUIT DRIVER HISTORY ({circuit}): No data available."

    lines = [f"RECENT RESULTS AT THIS CIRCUIT — {circuit}:"]
    for race in circuit_results:
        lines.append(f"\n  {race['season']} {race['race']}:")
        for r in race["results"]:
            lines.append(f"    P{r['position']}. {r['code']} ({r['constructor']})")
    return "\n".join(lines)


def format_weather(weather: str) -> str:
    """T-036 — weather context."""
    descriptions = {
        "dry":   "DRY — clear/sunny conditions expected. Standard tyre strategy likely.",
        "wet":   "WET — rain expected. Full wets or intermediates in play. Chaos factor high.",
        "mixed": "MIXED — changing conditions expected. Strategy and adaptability will be key.",
    }
    return f"EXPECTED CONDITIONS: {descriptions.get(weather, weather.upper())}"


def build_prediction_context(
    standings: list[dict],
    constructor_standings: list[dict],
    recent_results: list[dict],
    circuit_history: list[dict],
    circuit_driver_results: list[dict],
    race_info: dict,
    weather: str = "dry",
) -> str:
    chaos = format_chaos(race_info.get("circuit_id", ""))
    sections = [
        format_race_info(race_info),
        "",
        format_weather(weather),
        *(["", chaos] if chaos else []),
        "",
        format_standings(standings),
        "",
        format_constructor_standings(constructor_standings),
        "",
        format_recent_results(recent_results),
        "",
        format_driver_form(recent_results),
        "",
        format_circuit_history(circuit_history, race_info["circuit"]),
        "",
        format_circuit_driver_results(circuit_driver_results, race_info["circuit"]),
    ]
    return "\n".join(sections)

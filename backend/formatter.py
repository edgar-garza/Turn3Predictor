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
    sections = [
        format_race_info(race_info),
        "",
        format_weather(weather),
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

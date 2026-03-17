"""
T-013 / T-032 — Data formatter for prediction prompts.

Converts raw API data into a structured plain-text context block
that gets injected into the Claude system prompt.

Inputs (T-032 — defined prediction data inputs):
  1. Current driver championship standings
  2. Last 5 race results (recent form)
  3. Circuit historical winners (track-specific data)
  4. Upcoming race info (name, circuit, country)
"""


def format_standings(standings: list[dict]) -> str:
    lines = ["DRIVER CHAMPIONSHIP STANDINGS (current season):"]
    for d in standings[:10]:  # top 10 only — keeps prompt tight
        lines.append(
            f"  P{d['position']}. {d['driver']} ({d['code']}) — "
            f"{d['constructor']} — {d['points']} pts, {d['wins']} wins"
        )
    return "\n".join(lines)


def format_recent_results(results: list[dict]) -> str:
    if not results:
        return "RECENT RACE RESULTS: No completed races yet this season."

    sections = ["RECENT RACE RESULTS (last 5 races, newest first):"]
    for race in reversed(results):
        sections.append(f"\n  {race['race']} (Round {race['round']}, {race['date']}):")
        for r in race["results"][:5]:  # top 5 finishers per race
            sections.append(f"    P{r['position']}. {r['driver']} ({r['constructor']})")
    return "\n".join(sections)


def format_circuit_history(history: list[dict], circuit: str) -> str:
    if not history:
        return f"CIRCUIT HISTORY ({circuit}): No historical data available."

    lines = [f"CIRCUIT HISTORY — {circuit} (last {len(history)} races, most recent first):"]
    for h in history:
        lines.append(
            f"  {h['season']}: {h['winner']} ({h['constructor']})"
        )
    return "\n".join(lines)


def format_race_info(race: dict) -> str:
    return (
        f"UPCOMING RACE:\n"
        f"  Name    : {race['race']}\n"
        f"  Circuit : {race['circuit']}\n"
        f"  Country : {race['country']}\n"
        f"  Date    : {race['date']}\n"
        f"  Round   : {race['round']} of the current season"
    )


def build_prediction_context(
    standings: list[dict],
    recent_results: list[dict],
    circuit_history: list[dict],
    race_info: dict,
) -> str:
    """
    Combine all data sources into a single context string for Claude.
    """
    sections = [
        format_race_info(race_info),
        "",
        format_standings(standings),
        "",
        format_recent_results(recent_results),
        "",
        format_circuit_history(circuit_history, race_info["circuit"]),
    ]
    return "\n".join(sections)

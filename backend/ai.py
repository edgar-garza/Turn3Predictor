"""
T-016 / T-017 — Anthropic Claude integration.

Handles the system prompt, prediction call, JSON parsing,
and fallback handling (T-022).
"""

import os
import json
import anthropic

SYSTEM_PROMPT = """You are an expert Formula 1 race analyst and predictor for the Turn 3 Podcast — an F1 fan show known for sharp, confident takes.

Your job is to predict the top 5 finishers for an upcoming F1 race using the real data provided. You will receive:
- Driver and constructor championship standings
- Recent race results and each driver's positional form
- Expected race conditions (dry / wet / mixed)
- Historical winners at this specific circuit
- Full grid results from recent editions of this race

Reason like a seasoned analyst. Weigh current-season pace, recent form trends, constructor reliability, and circuit-specific performance history. A driver who consistently performs at a specific track is a different proposition to one on general form.

RULES:
- Predict P1 through P5. Use only drivers currently on the F1 grid. No driver may appear twice.
- Base every pick on the data provided — cite specific numbers in your reasoning.
- Be decisive. Commit to your picks — no "could go either way" hedging.
- If conditions are wet or mixed, weight wet-weather specialists and recent DNF patterns higher.
- If the data strongly favours one team, say so and explain why a challenger might upset.
- Confidence score: 1–10 (10 = near certain, 1 = coin flip).

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown fences, no extra text:
{
  "race": "<race name>",
  "podium": {
    "P1": {"driver": "<full name>", "code": "<3-letter code>", "constructor": "<team>"},
    "P2": {"driver": "<full name>", "code": "<3-letter code>", "constructor": "<team>"},
    "P3": {"driver": "<full name>", "code": "<3-letter code>", "constructor": "<team>"},
    "P4": {"driver": "<full name>", "code": "<3-letter code>", "constructor": "<team>"},
    "P5": {"driver": "<full name>", "code": "<3-letter code>", "constructor": "<team>"}
  },
  "confidence": <1-10>,
  "reasoning": "<2-3 sentences max. Reference specific data points. Punchy, podcast-ready tone. Name the biggest threat.>"
}"""


def generate_prediction(context: str, race_name: str) -> dict:
    """
    Call Claude with race context data and return a structured prediction.

    Args:
        context: Formatted string from formatter.build_prediction_context()
        race_name: Human-readable race name for the user message

    Returns:
        Parsed prediction dict with podium, confidence, and reasoning.

    Raises:
        ValueError: If Claude returns malformed JSON (T-022 fallback).
        anthropic.APIError: On upstream API failures.
    """
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=700,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Here is the data for the upcoming {race_name}.\n\n"
                    f"{context}\n\n"
                    "Based on this data, predict the top 5 finishers."
                ),
            }
        ],
    )

    raw = message.content[0].text.strip()

    # T-022 — fallback if Claude returns malformed JSON
    try:
        prediction = json.loads(raw)
    except json.JSONDecodeError:
        # Attempt to extract JSON block if wrapped in prose
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            prediction = json.loads(raw[start:end])
        else:
            raise ValueError(f"Claude returned malformed JSON: {raw[:200]}")

    # T-023 — token usage logging
    print(
        f"[token usage] input={message.usage.input_tokens} "
        f"output={message.usage.output_tokens} "
        f"race={race_name}"
    )

    return prediction

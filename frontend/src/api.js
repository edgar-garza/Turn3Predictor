const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function getSchedule() {
  const res = await fetch(`${BASE_URL}/schedule`)
  if (!res.ok) throw new Error('Failed to load race schedule')
  return res.json()
}

export async function getHistory(season = 2026) {
  const res = await fetch(`${BASE_URL}/history?season=${season}`)
  if (!res.ok) throw new Error('Failed to load prediction history')
  return res.json()
}

export async function getStats(season = 2026) {
  const res = await fetch(`${BASE_URL}/stats?season=${season}`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}

export async function getPrediction(circuitId, weather = 'dry') {
  const res = await fetch(`${BASE_URL}/predict/${circuitId}?weather=${weather}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Prediction failed')
  }
  return res.json()
}

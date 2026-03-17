const BASE_URL = 'http://localhost:8000'

export async function getSchedule() {
  const res = await fetch(`${BASE_URL}/schedule`)
  if (!res.ok) throw new Error('Failed to load race schedule')
  return res.json()
}

export async function getPrediction(circuitId) {
  const res = await fetch(`${BASE_URL}/predict/${circuitId}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Prediction failed')
  }
  return res.json()
}

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

export async function getVotes(circuitId, season = 2026) {
  const res = await fetch(`${BASE_URL}/votes/${circuitId}?season=${season}`)
  if (!res.ok) throw new Error('Failed to load votes')
  return res.json()
}

export async function castVote(circuitId, vote, season = 2026) {
  const res = await fetch(`${BASE_URL}/votes/${circuitId}?season=${season}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vote }),
  })
  if (!res.ok) throw new Error('Failed to cast vote')
  return res.json()
}

export async function getComments(circuitId, season = 2026) {
  const res = await fetch(`${BASE_URL}/comments/${circuitId}?season=${season}`)
  if (!res.ok) throw new Error('Failed to load comments')
  return res.json()
}

export async function postComment(circuitId, text, season = 2026) {
  const res = await fetch(`${BASE_URL}/comments/${circuitId}?season=${season}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to post comment')
  }
  return res.json()
}

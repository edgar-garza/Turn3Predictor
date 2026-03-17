// T-043 — Prediction history page

import { useEffect, useState } from 'react'
import { getHistory } from '../api'
import HistoryCard from '../components/HistoryCard'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getHistory()
      .then(data => setHistory([...data].reverse())) // most recent first
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-red-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <p className="text-red-400 text-sm text-center py-8">{error}</p>
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/30 text-sm">No predictions yet.</p>
        <p className="text-white/20 text-xs mt-1">Make your first prediction on the home tab.</p>
      </div>
    )
  }

  const scored = history.filter(e => e.status === 'scored')
  const pending = history.filter(e => e.status === 'pending')

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl">
      {scored.length > 0 && pending.length > 0 && (
        <p className="text-white/20 text-xs uppercase tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {pending.length} pending result{pending.length !== 1 ? 's' : ''}
        </p>
      )}
      {history.map(entry => (
        <HistoryCard key={`${entry.season}-${entry.round}-${entry.created_at}`} entry={entry} />
      ))}
    </div>
  )
}

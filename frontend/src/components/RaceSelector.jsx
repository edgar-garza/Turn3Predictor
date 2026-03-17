import { useEffect, useState } from 'react'
import { getSchedule } from '../api'

export default function RaceSelector({ onPredict, loading }) {
  const [schedule, setSchedule] = useState([])
  const [selected, setSelected] = useState('')
  const [scheduleError, setScheduleError] = useState(null)

  useEffect(() => {
    getSchedule()
      .then(races => {
        const today = new Date().toISOString().split('T')[0]
        const upcoming = races.filter(r => r.date >= today)
        setSchedule(upcoming)
        if (upcoming.length > 0) setSelected(upcoming[0].circuit_id)
      })
      .catch(() => setScheduleError('Could not load race schedule.'))
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const race = schedule.find(r => r.circuit_id === selected)
    if (selected) onPredict(selected, race?.race ?? selected)
  }

  if (scheduleError) {
    return <p className="text-red-400 text-sm">{scheduleError}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        disabled={loading || schedule.length === 0}
        className="flex-1 bg-white/5 border border-white/15 text-white rounded-lg px-4 py-3 text-base focus:outline-none focus:border-red-600 transition disabled:opacity-40"
        style={{ fontFamily: "'Barlow', sans-serif" }}
      >
        {schedule.length === 0 && (
          <option value="">Loading schedule...</option>
        )}
        {schedule.map(race => (
          <option key={race.circuit_id} value={race.circuit_id}>
            R{race.round} — {race.race} ({race.date})
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || !selected}
        className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest px-6 py-3 rounded-lg transition text-sm"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {loading ? 'Predicting...' : 'Predict'}
      </button>
    </form>
  )
}

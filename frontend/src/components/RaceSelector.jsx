import { useEffect, useState } from 'react'
import { getSchedule } from '../api'

const WEATHER_OPTIONS = [
  { value: 'dry',   label: '☀️ Dry' },
  { value: 'wet',   label: '🌧️ Wet' },
  { value: 'mixed', label: '⛅ Mixed' },
]

export default function RaceSelector({ onPredict, loading }) {
  const [schedule, setSchedule] = useState([])
  const [selected, setSelected] = useState('')
  const [weather, setWeather] = useState('dry')
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
    if (selected) onPredict(selected, race?.race ?? selected, weather)
  }

  if (scheduleError) {
    return <p className="text-red-400 text-sm">{scheduleError}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xl">
      {/* Race dropdown + predict button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={loading || schedule.length === 0}
          className="flex-1 bg-white/5 border border-white/15 text-white rounded-lg px-4 py-3 text-base focus:outline-none focus:border-red-600 transition disabled:opacity-40"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          {schedule.length === 0 && <option value="">Loading schedule...</option>}
          {schedule.map(race => (
            <option key={race.circuit_id} value={race.circuit_id}>
              R{race.round} — {race.race} ({race.date})
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading || !selected}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest px-6 py-3 rounded-lg transition text-sm whitespace-nowrap"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {loading ? 'Predicting...' : 'Predict'}
        </button>
      </div>

      {/* T-036 — Weather selector */}
      <div className="flex items-center gap-2">
        <span className="text-white/30 text-xs uppercase tracking-widest mr-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Conditions
        </span>
        {WEATHER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setWeather(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              weather === opt.value
                ? 'bg-white/10 border-white/30 text-white'
                : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </form>
  )
}

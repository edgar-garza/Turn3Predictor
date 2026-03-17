import { useState } from 'react'
import { getPrediction } from './api'
import Header from './components/Header'
import RaceSelector from './components/RaceSelector'
import LoadingSpinner from './components/LoadingSpinner'
import PredictionCard from './components/PredictionCard'
import './App.css'

export default function App() {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentRace, setCurrentRace] = useState('')

  async function handlePredict(circuitId, raceName) {
    setLoading(true)
    setError(null)
    setPrediction(null)
    setCurrentRace(raceName)
    try {
      const result = await getPrediction(circuitId)
      setPrediction(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center px-6 py-12 gap-10">
        {/* Hero */}
        <div className="text-center max-w-xl">
          <h1
            className="text-5xl sm:text-6xl font-black uppercase leading-none text-white mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Who wins <span className="text-red-600">Sunday?</span>
          </h1>
          <p className="text-white/40 text-base">
            AI-powered F1 race predictions. Pick a race, get the podium.
          </p>
        </div>

        {/* Selector */}
        <RaceSelector
          onPredict={handlePredict}
          loading={loading}
        />

        {/* States */}
        {loading && <LoadingSpinner race={currentRace} />}

        {error && (
          <div className="w-full max-w-xl border border-red-600/40 bg-red-600/10 rounded-xl px-5 py-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {prediction && !loading && (
          <PredictionCard prediction={prediction} />
        )}
      </main>

      <footer className="border-t border-white/10 px-6 py-4 text-center">
        <p className="text-white/20 text-xs uppercase tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Turn 3 Podcast · Predictions powered by Claude AI
        </p>
      </footer>
    </div>
  )
}

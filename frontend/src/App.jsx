import { useState } from 'react'
import { getPrediction } from './api'
import Header from './components/Header'
import RaceSelector from './components/RaceSelector'
import LoadingSpinner from './components/LoadingSpinner'
import PredictionCard from './components/PredictionCard'
import ErrorCard from './components/ErrorCard'
import './App.css'

export default function App() {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentRace, setCurrentRace] = useState('')
  const [lastRequest, setLastRequest] = useState(null) // for retry

  async function handlePredict(circuitId, raceName, weather = 'dry') {
    setLoading(true)
    setError(null)
    setPrediction(null)
    setCurrentRace(raceName)
    setLastRequest({ circuitId, raceName, weather })
    try {
      const result = await getPrediction(circuitId, weather)
      setPrediction({ ...result, weather })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleRetry() {
    if (lastRequest) {
      handlePredict(lastRequest.circuitId, lastRequest.raceName, lastRequest.weather)
    }
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12 gap-8 sm:gap-10">
        {/* Hero */}
        <div className="text-center max-w-xl">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-none text-white mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Who wins <span className="text-red-600">Sunday?</span>
          </h1>
          <p className="text-white/40 text-sm sm:text-base">
            AI-powered F1 race predictions. Pick a race, get the podium.
          </p>
        </div>

        {/* Selector */}
        <RaceSelector onPredict={handlePredict} loading={loading} />

        {/* States */}
        {loading && <LoadingSpinner race={currentRace} />}
        {error && <ErrorCard message={error} onRetry={handleRetry} />}
        {prediction && !loading && <PredictionCard prediction={prediction} />}
      </main>

      <footer className="border-t border-white/10 px-4 sm:px-6 py-4 text-center">
        <p
          className="text-white/20 text-xs uppercase tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Turn 3 Podcast · Predictions powered by Claude AI
        </p>
      </footer>
    </div>
  )
}

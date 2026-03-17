import { useState, useEffect } from 'react'
import { getPrediction, getStats } from './api'
import Header from './components/Header'
import RaceSelector from './components/RaceSelector'
import LoadingSpinner from './components/LoadingSpinner'
import PredictionCard from './components/PredictionCard'
import ErrorCard from './components/ErrorCard'
import StatsBar from './components/StatsBar'
import PageFiller from './components/PageFiller'
import HistoryPage from './pages/HistoryPage'
import './App.css'

function TabBar({ active, onChange }) {
  const tabs = ['Predict', 'History']
  return (
    <div className="flex border-b border-white/10 w-full">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-5 py-3 text-sm font-bold uppercase tracking-widest transition border-b-2 -mb-px ${
            active === tab
              ? 'border-red-600 text-white'
              : 'border-transparent text-white/30 hover:text-white/60'
          }`}
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('Predict')
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentRace, setCurrentRace] = useState('')
  const [lastRequest, setLastRequest] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
  }, [prediction]) // refresh after each new prediction

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
    if (lastRequest) handlePredict(lastRequest.circuitId, lastRequest.raceName, lastRequest.weather)
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col">
      <Header />
      <TabBar active={tab} onChange={setTab} />

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 sm:py-10 gap-7 sm:gap-9">

        {tab === 'Predict' && (
          <>
            <div className="text-center max-w-xl flex flex-col items-center gap-4">
              {/* Hero logo */}
              <img
                src="/Turn3LogoPNG.png"
                alt="Turn 3 Podcast"
                className="h-16 sm:h-24 w-auto block"
                style={{ filter: 'brightness(0) invert(1)' }}
              />

              {/* Headline */}
              <div>
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-none text-white mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Who wins <span className="text-red-600">Sunday?</span>
                </h1>
                <p className="text-white/40 text-sm sm:text-base">
                  AI-powered F1 race predictions. Pick a race, get the podium.
                </p>
              </div>
            </div>

            <StatsBar stats={stats} />
            <RaceSelector onPredict={handlePredict} loading={loading} />

            {loading && <LoadingSpinner race={currentRace} />}
            {error && <ErrorCard message={error} onRetry={handleRetry} />}
            {prediction && !loading && <PredictionCard prediction={prediction} />}
            {!prediction && !loading && !error && <PageFiller />}
          </>
        )}

        {tab === 'History' && <HistoryPage />}
      </main>

      <footer className="border-t border-white/10 px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <img
          src="/Turn3LogoPNG.png"
          alt="Turn 3 Podcast"
          className="h-5 w-auto block"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <p
          className="text-white/20 text-xs uppercase tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Predictions powered by Claude AI
        </p>
      </footer>
    </div>
  )
}

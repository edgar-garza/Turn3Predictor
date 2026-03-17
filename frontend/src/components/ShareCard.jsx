import { forwardRef, useEffect, useRef } from 'react'

const POSITION_COLORS = {
  P1: { bg: '#78350f', border: '#d97706', label: '#fbbf24' },
  P2: { bg: '#1f2937', border: '#6b7280', label: '#d1d5db' },
  P3: { bg: '#431407', border: '#b45309', label: '#f97316' },
}

const ShareCard = forwardRef(function ShareCard({ prediction, votes }, ref) {
  const { race, podium, confidence, reasoning } = prediction
  const logoCanvasRef = useRef(null)

  useEffect(() => {
    const canvas = logoCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      // Make every non-transparent pixel white (equivalent to brightness(0) invert(1))
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
        }
      }
      ctx.putImageData(imageData, 0, 0)
    }
    img.src = '/Turn3LogoPNG.png'
  }, [])
  const total = (votes?.agree || 0) + (votes?.disagree || 0)
  const agreePct = total > 0 ? Math.round((votes.agree / total) * 100) : null

  const confidenceColor =
    confidence >= 8 ? '#4ade80' :
    confidence >= 5 ? '#facc15' : '#f87171'

  return (
    <div
      ref={ref}
      style={{
        width: '600px',
        background: '#0a0a0a',
        padding: '44px 40px 36px',
        fontFamily: "'Barlow Condensed', sans-serif",
        color: '#ffffff',
        position: 'absolute',
        left: '0',
        top: '0',
        visibility: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ flex: 1 }} />
        <canvas
          ref={logoCanvasRef}
          style={{ height: '52px', width: 'auto' }}
        />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            background: confidenceColor + '22',
            border: `1px solid ${confidenceColor}66`,
            borderRadius: '999px',
            padding: '4px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ color: confidenceColor, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Confidence</span>
            <span style={{ color: confidenceColor, fontSize: '20px', fontWeight: 900 }}>{confidence}/10</span>
          </div>
        </div>
      </div>

      {/* Race name */}
      <div style={{ marginBottom: '6px' }}>
        <span style={{ color: '#dc2626', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700 }}>
          AI Prediction
        </span>
      </div>
      <h2 style={{ margin: '0 0 24px', fontSize: '40px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-0.5px' }}>
        {race}
      </h2>

      {/* Podium */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
        {['P1', 'P2', 'P3'].map(pos => {
          const c = POSITION_COLORS[pos]
          const driver = podium[pos]
          return (
            <div key={pos} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: c.bg + '55',
              border: `1px solid ${c.border}66`,
              borderRadius: '12px',
              padding: '12px 18px',
            }}>
              <span style={{ color: c.label, fontSize: '26px', fontWeight: 900, width: '36px', textAlign: 'center', flexShrink: 0, lineHeight: 1 }}>{pos}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>{driver.driver}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '4px', lineHeight: 1.2 }}>{driver.constructor}</div>
              </div>
              <span style={{
                background: c.bg,
                border: `1px solid ${c.border}66`,
                color: c.label,
                fontSize: '12px',
                fontWeight: 900,
                letterSpacing: '1px',
                padding: '3px 8px',
                borderRadius: '6px',
              }}>{driver.code}</span>
            </div>
          )
        })}
      </div>

      {/* Reasoning */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '16px 18px',
        marginBottom: '24px',
      }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
          AI Analysis
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontFamily: 'sans-serif' }}>{reasoning}</p>
      </div>

      {/* Vote bar */}
      {total > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 700 }}>
            Fan Vote — {total} {total === 1 ? 'vote' : 'votes'}
          </div>
          <div style={{ display: 'flex', height: '8px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', marginBottom: '8px' }}>
            <div style={{ width: `${agreePct}%`, background: '#22c55e', transition: 'none' }} />
            <div style={{ width: `${100 - agreePct}%`, background: '#ef4444', transition: 'none' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
            <span style={{ color: '#22c55e' }}>👍 {agreePct}% Agree ({votes.agree})</span>
            <span style={{ color: '#ef4444' }}>👎 {100 - agreePct}% Disagree ({votes.disagree})</span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }} />

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
            Tell us what you think on our latest video!
          </div>
          <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 700 }}>youtube.com/@Turn3Podcast</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px' }}>turn3predictor.vercel.app</div>
        </div>
      </div>
    </div>
  )
})

export default ShareCard

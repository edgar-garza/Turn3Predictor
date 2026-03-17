const YT_URL = 'https://www.youtube.com/@Turn3Podcast'

function HowItWorks() {
  const steps = [
    { num: '01', label: 'Pick a race', desc: 'Select any upcoming Grand Prix from the 2026 calendar.' },
    { num: '02', label: 'Get the prediction', desc: 'Our AI analyses standings, form, and circuit history to call the podium.' },
    { num: '03', label: 'Share your take', desc: 'Agree? Disagree? Drop it in the comments on our latest video.' },
  ]

  return (
    <div className="w-full max-w-xl flex flex-col gap-3">
      <p className="text-white/30 text-xs uppercase tracking-widest"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        How it works
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map(s => (
          <div key={s.num} className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
            <span className="text-red-600 text-2xl font-black block mb-1 leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {s.num}
            </span>
            <p className="text-white font-bold text-sm mb-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {s.label}
            </p>
            <p className="text-white/40 text-xs leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function YouTubeBanner() {
  return (
    <a
      href={YT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full max-w-xl flex items-center gap-4 border border-red-600/30 bg-red-600/5 hover:bg-red-600/10 rounded-xl px-5 py-4 transition group"
    >
      {/* YouTube icon */}
      <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-600 rounded-lg">
        <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Share your results on our latest video!
        </p>
        <p className="text-white/40 text-xs mt-0.5">Turn 3 Podcast on YouTube</p>
      </div>

      <span className="text-red-500 text-lg group-hover:translate-x-1 transition-transform shrink-0">→</span>
    </a>
  )
}

export default function PageFiller() {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <HowItWorks />
      <YouTubeBanner />
    </div>
  )
}

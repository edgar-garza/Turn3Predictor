// T-031 — Error state component
export default function ErrorCard({ message, onRetry }) {
  return (
    <div className="w-full max-w-xl border border-red-600/30 bg-red-600/5 rounded-xl px-5 py-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="text-red-500 text-lg mt-0.5">✕</span>
        <div>
          <p
            className="text-red-400 font-bold uppercase tracking-wide text-sm mb-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Prediction failed
          </p>
          <p className="text-white/50 text-sm leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="self-start text-xs font-bold uppercase tracking-widest text-red-400 border border-red-600/30 rounded-lg px-4 py-2 hover:bg-red-600/10 transition"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Try again
        </button>
      )}
    </div>
  )
}

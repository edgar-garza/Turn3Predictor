export default function LoadingSpinner({ race }) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      {/* Animated F1-style spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 animate-spin" />
      </div>
      <div>
        <p
          className="text-xl font-bold uppercase tracking-widest text-white"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Analysing the data
        </p>
        {race && (
          <p className="text-sm text-white/40 mt-1">{race}</p>
        )}
      </div>
    </div>
  )
}

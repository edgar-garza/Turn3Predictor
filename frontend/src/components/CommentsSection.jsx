import { useState, useEffect } from 'react'
import { getComments, postComment } from '../api'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function CommentsSection({ circuitId }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getComments(circuitId)
      .then(setComments)
      .catch(() => {})
  }, [circuitId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const comment = await postComment(circuitId, text.trim())
      setComments(prev => [comment, ...prev])
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <p className="text-xs uppercase tracking-widest text-white/40 mb-4">
        Comments
      </p>

      <form onSubmit={handleSubmit} className="mb-5">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={500}
            placeholder="What do you think?"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="px-4 py-2 rounded-lg bg-white/10 text-sm text-white font-semibold hover:bg-white/20 disabled:opacity-40 transition-all"
          >
            {submitting ? '...' : 'Post'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-white/30 text-center py-4">
          No comments yet. Be the first.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map(c => (
            <li key={c.id} className="bg-white/5 rounded-lg px-4 py-3">
              <p className="text-sm text-white/80">{c.text}</p>
              <p className="text-xs text-white/30 mt-1">{timeAgo(c.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

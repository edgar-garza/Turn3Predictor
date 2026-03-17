/**
 * Generates a branded Turn3 share card PNG as a data URL using Canvas 2D.
 * Completely avoids html2canvas / html-to-image DOM capture quirks.
 */

const POSITION_COLORS = {
  P1: { bg: '#78350f', border: '#d97706', label: '#fbbf24' },
  P2: { bg: '#1f2937', border: '#6b7280', label: '#d1d5db' },
  P3: { bg: '#431407', border: '#b45309', label: '#f97316' },
  P4: { bg: '#134e4a', border: '#0d9488', label: '#5eead4' },
  P5: { bg: '#2e1065', border: '#7c3aed', label: '#c4b5fd' },
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function fillWrapped(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ')
  let line = ''
  let curY = y
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, curY)
      line = word
      curY += lh
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, curY)
}

function countLines(ctx, text, maxW) {
  const words = text.split(' ')
  let line = ''
  let count = 1
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxW && line) {
      count++
      line = word
    } else {
      line = test
    }
  }
  return count
}

async function loadWhiteLogo() {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, c.width, c.height)
      for (let i = 0; i < id.data.length; i += 4) {
        if (id.data[i + 3] > 0) {
          id.data[i] = id.data[i + 1] = id.data[i + 2] = 255
        }
      }
      ctx.putImageData(id, 0, 0)
      resolve(c)
    }
    img.onerror = () => resolve(null)
    img.src = '/Turn3LogoPNG.png'
  })
}

export async function generateShareCard(prediction, votes) {
  const { race, podium, confidence, reasoning } = prediction
  const S = 2        // pixel ratio
  const W = 600      // logical width
  const PH = 40      // horizontal padding
  const cW = W - PH * 2
  const LH = 22      // reasoning line height
  const barlow = '"Barlow Condensed", Arial, sans-serif'

  const confidenceColor =
    confidence >= 8 ? '#4ade80' :
    confidence >= 5 ? '#facc15' : '#f87171'

  const positionCount = ['P1', 'P2', 'P3', 'P4', 'P5'].filter(p => podium[p]).length
  const total = (votes?.agree || 0) + (votes?.disagree || 0)
  const hasVotes = total > 0
  const agreePct = hasVotes ? Math.round((votes.agree / total) * 100) : 0

  // ── Pre-measure reasoning text ─────────────────────────────────────────
  const mC = document.createElement('canvas')
  const mCtx = mC.getContext('2d')
  mCtx.font = '14px Arial, sans-serif'
  const reasoningLines = countLines(mCtx, reasoning, cW - 36)
  const reasoningH = reasoningLines * LH
  // analysisBox: 16 top-pad + 16 label + 8 gap + text + 16 bottom-pad
  const analysisBoxH = 56 + reasoningH

  // ── Calculate total canvas height ──────────────────────────────────────
  let H = 0
  H += 44              // top padding
  H += 80              // header row (logo height)
  H += 28              // gap
  H += 16              // "AI PREDICTION" label
  H += 8               // gap
  H += 48              // race name
  H += 24              // gap
  H += positionCount * 72 + (positionCount - 1) * 10 // podium rows + gaps
  H += 28              // gap
  H += analysisBoxH
  H += 24              // gap
  if (hasVotes) {
    H += 18 + 10 + 8 + 8 + 20 + 28
  }
  H += 1 + 20          // divider + gap
  H += 22 + 4 + 18     // CTA two lines
  H += 36              // bottom padding

  // ── Create canvas ──────────────────────────────────────────────────────
  const canvas = document.createElement('canvas')
  canvas.width = W * S
  canvas.height = H * S
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  // Background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, W, H)

  let y = 44

  // ── Logo (centered, white) ─────────────────────────────────────────────
  const logoCanvas = await loadWhiteLogo()
  if (logoCanvas) {
    const lH = 72
    const lW = (logoCanvas.width / logoCanvas.height) * lH
    ctx.drawImage(logoCanvas, (W - lW) / 2, y + (80 - lH) / 2, lW, lH)
  }

  // ── Confidence badge (top right) ───────────────────────────────────────
  ctx.font = `700 11px ${barlow}`
  const confLabelW = ctx.measureText('CONFIDENCE').width
  ctx.font = `900 20px ${barlow}`
  const confNumW = ctx.measureText(`${confidence}/10`).width
  const badgeW = 14 + confLabelW + 6 + confNumW + 14
  const badgeH = 28
  const badgeX = W - PH - badgeW
  const badgeY = y + (80 - badgeH) / 2

  ctx.fillStyle = confidenceColor + '22'
  rrect(ctx, badgeX, badgeY, badgeW, badgeH, 14)
  ctx.fill()
  ctx.strokeStyle = confidenceColor + '66'
  ctx.lineWidth = 1
  rrect(ctx, badgeX, badgeY, badgeW, badgeH, 14)
  ctx.stroke()

  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.font = `700 11px ${barlow}`
  ctx.fillStyle = confidenceColor
  ctx.fillText('CONFIDENCE', badgeX + 14, badgeY + badgeH / 2)
  ctx.font = `900 20px ${barlow}`
  ctx.fillText(`${confidence}/10`, badgeX + 14 + confLabelW + 6, badgeY + badgeH / 2)

  y += 80 + 28

  // ── "AI PREDICTION" label ──────────────────────────────────────────────
  ctx.font = `700 13px ${barlow}`
  ctx.fillStyle = '#dc2626'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText('AI PREDICTION', PH, y)
  y += 16 + 8

  // ── Race name ──────────────────────────────────────────────────────────
  ctx.font = `900 40px ${barlow}`
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'top'
  ctx.fillText(race.toUpperCase(), PH, y)
  y += 48 + 24

  // ── Podium rows ────────────────────────────────────────────────────────
  const positions = ['P1', 'P2', 'P3', 'P4', 'P5'].filter(p => podium[p])
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    const c = POSITION_COLORS[pos]
    const driver = podium[pos]
    const rH = 72

    ctx.fillStyle = hexToRgba(c.bg, 0.33)
    rrect(ctx, PH, y, cW, rH, 12)
    ctx.fill()
    ctx.strokeStyle = c.border + '66'
    ctx.lineWidth = 1
    rrect(ctx, PH, y, cW, rH, 12)
    ctx.stroke()

    const mid = y + rH / 2

    // Position label
    ctx.font = `900 26px ${barlow}`
    ctx.fillStyle = c.label
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(pos, PH + 18 + 18, mid)

    // Driver name
    ctx.font = `800 22px ${barlow}`
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText(driver.driver, PH + 18 + 52, mid - 11)

    // Constructor
    ctx.font = `400 13px Arial, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText(driver.constructor, PH + 18 + 52, mid + 12)

    // Code badge
    ctx.font = `900 11px ${barlow}`
    const codeW = ctx.measureText(driver.code).width
    const cbW = codeW + 16
    const cbH = 20
    const cbX = PH + cW - 18 - cbW
    const cbY = mid - cbH / 2

    ctx.fillStyle = c.bg
    rrect(ctx, cbX, cbY, cbW, cbH, 5)
    ctx.fill()
    ctx.strokeStyle = c.border + '66'
    ctx.lineWidth = 1
    rrect(ctx, cbX, cbY, cbW, cbH, 5)
    ctx.stroke()

    ctx.fillStyle = c.label
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(driver.code, cbX + cbW / 2, mid)

    y += rH
    if (i < positions.length - 1) y += 10
  }

  y += 28

  // ── AI Analysis box ────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  rrect(ctx, PH, y, cW, analysisBoxH, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  rrect(ctx, PH, y, cW, analysisBoxH, 12)
  ctx.stroke()

  ctx.font = `700 11px ${barlow}`
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText('AI ANALYSIS', PH + 18, y + 16)

  ctx.font = '14px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  fillWrapped(ctx, reasoning, PH + 18, y + 40, cW - 36, LH)

  y += analysisBoxH + 24

  // ── Vote bar ───────────────────────────────────────────────────────────
  if (hasVotes) {
    ctx.font = `700 11px ${barlow}`
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    ctx.fillText(`FAN VOTE \u2014 ${total} ${total === 1 ? 'VOTE' : 'VOTES'}`, PH, y)
    y += 18 + 10

    const bH = 8
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    rrect(ctx, PH, y, cW, bH, 4)
    ctx.fill()
    if (agreePct > 0) {
      ctx.fillStyle = '#22c55e'
      rrect(ctx, PH, y, cW * agreePct / 100, bH, 4)
      ctx.fill()
    }
    if (agreePct < 100) {
      ctx.fillStyle = '#ef4444'
      rrect(ctx, PH + cW * agreePct / 100, y, cW * (100 - agreePct) / 100, bH, 4)
      ctx.fill()
    }
    y += bH + 8

    ctx.font = `700 13px ${barlow}`
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#22c55e'
    ctx.textAlign = 'left'
    ctx.fillText(`${agreePct}% Agree (${votes.agree})`, PH, y)
    ctx.fillStyle = '#ef4444'
    ctx.textAlign = 'right'
    ctx.fillText(`${100 - agreePct}% Disagree (${votes.disagree})`, PH + cW, y)
    y += 20 + 28
  }

  // ── Divider ────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PH, y)
  ctx.lineTo(W - PH, y)
  ctx.stroke()
  y += 20

  // ── CTA ────────────────────────────────────────────────────────────────
  ctx.font = `800 15px ${barlow}`
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText('Tell us what you think on our latest video!', PH, y)
  y += 22 + 4

  ctx.font = `700 13px ${barlow}`
  ctx.fillStyle = '#dc2626'
  ctx.fillText('youtube.com/@Turn3Podcast', PH, y)

  ctx.font = '11px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.textAlign = 'right'
  ctx.fillText('turn3-predictor.vercel.app', W - PH, y)

  return canvas.toDataURL('image/png')
}

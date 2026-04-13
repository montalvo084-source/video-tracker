import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function XPCounter({ total }) {
  const [displayVal, setDisplayVal] = React.useState(total)
  const [flash, setFlash] = React.useState(false)
  const prevRef = React.useRef(total)

  React.useEffect(() => {
    if (total === prevRef.current) return
    const diff = total - prevRef.current
    prevRef.current = total

    if (diff <= 0) {
      setDisplayVal(total)
      return
    }

    setFlash(true)
    const start = displayVal
    const duration = 600
    const startTime = performance.now()

    function step(now) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayVal(Math.round(start + diff * eased))
      if (t < 1) requestAnimationFrame(step)
      else {
        setDisplayVal(total)
        setTimeout(() => setFlash(false), 400)
      }
    }
    requestAnimationFrame(step)
  }, [total])

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        background: flash ? 'var(--accent-glow-strong)' : 'var(--accent-glow)',
        border: '1px solid',
        borderColor: flash ? 'var(--accent)' : 'rgba(196,149,106,0.2)',
        transition: 'background 0.3s, border-color 0.3s',
      }}
      animate={flash ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <span style={{ fontSize: 13 }}>⚡</span>
      <span
        className="mono"
        style={{
          color: 'var(--accent)',
          fontSize: 12,
          letterSpacing: '0.02em',
        }}
      >
        {displayVal.toLocaleString()} XP
      </span>
    </motion.div>
  )
}

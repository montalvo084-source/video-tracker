import { motion } from 'framer-motion'

export default function ProgressBar({ progress, height = 6, showLabel = false, className = '' }) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100)
  const color = progress >= 1 ? 'var(--success)' : 'var(--accent)'
  const trackColor = progress >= 1 ? 'var(--success-glow)' : 'rgba(196,149,106,0.12)'

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          flex: 1,
          height,
          background: trackColor,
          borderRadius: 99,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            background: color,
            borderRadius: 99,
            boxShadow: progress >= 1
              ? '0 0 8px rgba(90,143,90,0.5)'
              : '0 0 8px rgba(196,149,106,0.35)',
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
      </div>
      {showLabel && (
        <span
          className="mono"
          style={{
            color: progress >= 1 ? 'var(--success)' : 'var(--accent)',
            minWidth: 32,
            textAlign: 'right',
          }}
        >
          {pct}%
        </span>
      )}
    </div>
  )
}

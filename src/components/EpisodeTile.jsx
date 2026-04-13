import { motion } from 'framer-motion'
import ProgressBar from './ProgressBar'
import { calcProgress, getNextAction } from '../hooks/useAppState'

export default function EpisodeTile({ video, series, isActive, onSelect }) {
  const progress = calcProgress(video)
  const next = getNextAction(video)
  const seriesObj = series?.find(s => s.id === video.seriesId)

  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.96 }}
      style={{
        flexShrink: 0,
        width: 140,
        padding: '12px 12px 10px',
        background: isActive ? 'var(--bg-elevated)' : 'var(--bg-card)',
        border: '1px solid',
        borderColor: isActive ? 'var(--accent)' : 'var(--border)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textAlign: 'left',
        cursor: 'pointer',
        boxShadow: isActive ? 'var(--shadow-accent)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Series dot + title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        {seriesObj && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: seriesObj.color,
              marginTop: 5,
              flexShrink: 0,
            }}
          />
        )}
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {video.title}
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar progress={progress} height={3} />

      {/* Current section label */}
      <span
        className="mono"
        style={{
          color: progress >= 1 ? 'var(--success)' : 'var(--text-muted)',
          fontSize: 10,
        }}
      >
        {progress >= 1 ? 'COMPLETE' : next ? next.section.toUpperCase() : 'IN PROGRESS'}
      </span>
    </motion.button>
  )
}

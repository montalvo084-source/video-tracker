import React from 'react'
import { motion } from 'framer-motion'
import { AppContext, calcProgress } from '../hooks/useAppState'
import ProgressBar from './ProgressBar'

export default function ArchiveView({ onOpenDetail }) {
  const { state } = React.useContext(AppContext)
  const { videos, config } = state

  const posted = videos.filter(v => {
    const status = config.statuses.find(s => s.id === v.statusId)
    return status?.label === 'Posted'
  })

  // Also show "complete" episodes (all steps done) regardless of status
  const complete = videos.filter(v => {
    const p = calcProgress(v)
    const status = config.statuses.find(s => s.id === v.statusId)
    return p >= 1 && status?.label !== 'Posted'
  })

  function renderCard(video) {
    const progress = calcProgress(video)
    const seriesObj = config.series?.find(s => s.id === video.seriesId)
    const status = config.statuses.find(s => s.id === video.statusId)

    return (
      <motion.button
        key={video.id}
        onClick={() => onOpenDetail(video.id)}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        {/* Series + title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          {seriesObj && (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: seriesObj.color, marginTop: 5, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.3 }}>{video.title}</p>
            {seriesObj && (
              <p className="mono" style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{seriesObj.name}</p>
            )}
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              color: status?.color || 'var(--success)',
              background: (status?.color || '#5A8F5A') + '20',
              border: '1px solid ' + (status?.color || '#5A8F5A') + '44',
              flexShrink: 0,
            }}
          >
            {status?.label}
          </span>
        </div>

        {/* Progress */}
        <ProgressBar progress={progress} height={4} showLabel />

        {/* Date */}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Created {new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </motion.button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>Archive</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Completed & posted episodes</p>
      </div>

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {posted.length === 0 && complete.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>
              No archived episodes yet.<br />
              Episodes marked "Posted" or fully completed will appear here.
            </p>
          </div>
        ) : (
          <>
            {posted.length > 0 && (
              <>
                <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>POSTED</span>
                {posted.map(renderCard)}
              </>
            )}
            {complete.length > 0 && (
              <>
                <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: posted.length > 0 ? 12 : 0, marginBottom: 4 }}>ALL STEPS DONE</span>
                {complete.map(renderCard)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

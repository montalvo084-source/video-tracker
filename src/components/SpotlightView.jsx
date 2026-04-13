import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext, calcProgress, getNextAction, isSectionComplete, isEpisodeComplete } from '../hooks/useAppState'
import ProgressBar from './ProgressBar'
import XPCounter from './XPCounter'
import EpisodeTile from './EpisodeTile'
import ConfettiBurst from './ConfettiBurst'

export default function SpotlightView({ spotlightId, onSetSpotlight, onOpenDetail, onNewEpisode }) {
  const { state, dispatch } = React.useContext(AppContext)
  const { videos, config } = state
  const [confettiTrigger, setConfettiTrigger] = React.useState(0)
  const [confettiFullscreen, setConfettiFullscreen] = React.useState(false)
  const [completedHint, setCompletedHint] = React.useState(null)

  // ── Active episodes (not fully posted) ──────
  const activeVideos = videos.filter(v => {
    const status = config.statuses.find(s => s.id === v.statusId)
    return status?.label !== 'Posted'
  })

  // ── Spotlight episode ────────────────────────
  const spotlighted = React.useMemo(() => {
    if (spotlightId) {
      const found = videos.find(v => v.id === spotlightId)
      if (found) return found
    }
    // Auto-select: most recently touched active episode
    return activeVideos.sort((a, b) =>
      new Date(b.lastTouched || b.createdAt) - new Date(a.lastTouched || a.createdAt)
    )[0] || videos[0] || null
  }, [videos, spotlightId])

  const otherVideos = activeVideos.filter(v => v.id !== spotlighted?.id)
  const progress = spotlighted ? calcProgress(spotlighted) : 0
  const nextAction = spotlighted ? getNextAction(spotlighted) : null
  const seriesObj = spotlighted ? config.series?.find(s => s.id === spotlighted.seriesId) : null
  const xpTotal = config.xp?.total || 0

  function handleCompleteNextAction() {
    if (!spotlighted || !nextAction) return

    const wasEpisodeComplete = isEpisodeComplete(spotlighted)
    let wasSectionComplete = false

    if (nextAction.isPlatform) {
      wasSectionComplete = isSectionComplete(spotlighted, 'platforms')
      dispatch({ type: 'TOGGLE_PLATFORM', payload: { videoId: spotlighted.id, platformId: nextAction.id } })
    } else {
      wasSectionComplete = isSectionComplete(spotlighted, nextAction.listKey)
      dispatch({ type: 'TOGGLE_ITEM', payload: { videoId: spotlighted.id, listKey: nextAction.listKey, itemId: nextAction.id } })
    }

    dispatch({ type: 'TOUCH_VIDEO', payload: { videoId: spotlighted.id } })
    dispatch({ type: 'GAIN_XP', payload: { action: 'phase_checked', points: 10, episodeId: spotlighted.id } })

    // Check if section just completed (after this toggle)
    const updatedVideo = { ...spotlighted }
    if (nextAction.isPlatform) {
      updatedVideo.platforms = spotlighted.platforms.map(p => p.id === nextAction.id ? { ...p, posted: true } : p)
    } else {
      updatedVideo[nextAction.listKey] = spotlighted[nextAction.listKey].map(i => i.id === nextAction.id ? { ...i, checked: true } : i)
    }

    const nowEpisodeComplete = isEpisodeComplete(updatedVideo)
    if (nowEpisodeComplete && !wasEpisodeComplete) {
      dispatch({ type: 'GAIN_XP', payload: { action: 'episode_complete', points: 100, episodeId: spotlighted.id } })
      setConfettiFullscreen(true)
      setConfettiTrigger(t => t + 1)
      setCompletedHint('Episode complete! 🎉')
      setTimeout(() => { setConfettiFullscreen(false); setCompletedHint(null) }, 3000)
    } else if (!wasSectionComplete) {
      const listKey = nextAction.isPlatform ? 'platforms' : nextAction.listKey
      const nowSectionComplete = nextAction.isPlatform
        ? updatedVideo.platforms.every(p => p.posted)
        : updatedVideo[listKey].every(i => i.checked)
      if (nowSectionComplete) {
        dispatch({ type: 'GAIN_XP', payload: { action: 'section_complete', points: 25, episodeId: spotlighted.id } })
        setConfettiFullscreen(false)
        setConfettiTrigger(t => t + 1)
        setCompletedHint(`${nextAction.section} done! +25 XP`)
        setTimeout(() => setCompletedHint(null), 2000)
      } else {
        setCompletedHint(null)
      }
    }
  }

  if (!spotlighted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 20, padding: 32 }}>
        <div style={{ fontSize: 48 }}>🎬</div>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
          No episodes yet. Create your first one to get started.
        </p>
        <button
          onClick={onNewEpisode}
          style={{
            padding: '14px 28px',
            background: 'var(--accent)',
            color: '#141210',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          + New Episode
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px 12px',
      }}>
        <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>MY EPISODES</span>
        <XPCounter total={xpTotal} />
      </div>

      {/* Spotlight Card */}
      <div style={{ padding: '0 16px', flex: '0 0 auto' }}>
        <motion.div
          layout
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 20,
            position: 'relative',
            overflow: 'visible',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
          }}
          onClick={() => onOpenDetail(spotlighted.id)}
          whileTap={{ scale: 0.99 }}
        >
          {/* Confetti anchor */}
          <ConfettiBurst trigger={confettiTrigger} count={confettiFullscreen ? 60 : 24} fullScreen={confettiFullscreen} />

          {/* Series badge */}
          {seriesObj && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: seriesObj.color }} />
              <span className="mono" style={{ color: seriesObj.color, fontSize: 10 }}>{seriesObj.name.toUpperCase()}</span>
            </div>
          )}

          {/* Title */}
          <h2 style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.25,
            marginBottom: 16,
            letterSpacing: '-0.01em',
          }}>
            {spotlighted.title}
          </h2>

          {/* Progress bar */}
          <ProgressBar progress={progress} height={8} showLabel className="spotlight-progress" />

          {/* Next action */}
          <div style={{ marginTop: 20 }} onClick={e => e.stopPropagation()}>
            {nextAction ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                    NEXT UP · {nextAction.section.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>tap card to open →</span>
                </div>
                {/* Step name — read-only info row */}
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  color: 'var(--text-primary)',
                  fontSize: 15,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent)', flexShrink: 0,
                  }} />
                  {nextAction.label}
                </div>
                {/* Explicit "Mark Done" button — visually separate from the step name */}
                <motion.button
                  onClick={handleCompleteNextAction}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    color: '#141210',
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  ✓ Mark Done
                </motion.button>
              </>
            ) : (
              <div style={{
                padding: '14px 18px',
                background: 'var(--success-glow)',
                border: '1px solid rgba(90,143,90,0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--success)',
                fontWeight: 600,
                fontSize: 15,
                textAlign: 'center',
              }}>
                ✓ All done — great work!
              </div>
            )}
          </div>

          {/* Completion hint */}
          <AnimatePresence>
            {completedHint && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: 10,
                  textAlign: 'center',
                  color: 'var(--success)',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {completedHint}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Other episodes */}
      {otherVideos.length > 0 && (
        <div style={{ padding: '20px 0 0', flex: '0 0 auto' }}>
          <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 10, display: 'block', paddingLeft: 20, marginBottom: 10 }}>
            IN PROGRESS
          </span>
          <div className="scroll-row" style={{ paddingLeft: 16, paddingRight: 16 }}>
            {otherVideos.map(v => (
              <EpisodeTile
                key={v.id}
                video={v}
                series={config.series}
                isActive={false}
                onSelect={() => onOpenDetail(v.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* New episode button */}
      <div style={{ padding: '20px 16px 12px', flex: '0 0 auto' }}>
        <button
          onClick={onNewEpisode}
          style={{
            width: '100%',
            padding: '13px',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--text-muted)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <span style={{ fontSize: 16 }}>+</span> New Episode
        </button>
      </div>
    </div>
  )
}

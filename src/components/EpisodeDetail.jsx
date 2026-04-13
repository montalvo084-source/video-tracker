import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext, calcProgress, isEpisodeComplete } from '../hooks/useAppState'
import ProgressBar from './ProgressBar'
import LifecycleSection from './LifecycleSection'
import ConfettiBurst from './ConfettiBurst'

// ── Notes Section ─────────────────────────────────
function NotesSection({ video }) {
  const { dispatch } = React.useContext(AppContext)
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [editingNote, setEditingNote] = React.useState(null)
  const [editDraft, setEditDraft] = React.useState('')

  function addNote() {
    const text = draft.trim()
    if (!text) return
    dispatch({ type: 'ADD_NOTE', payload: { videoId: video.id, text } })
    setDraft('')
  }

  function saveEdit(noteId) {
    const text = editDraft.trim()
    if (!text) return
    dispatch({ type: 'EDIT_NOTE', payload: { videoId: video.id, noteId, text } })
    setEditingNote(null)
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          minHeight: 'var(--touch-min)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.18 }} style={{ color: 'var(--text-muted)', fontSize: 12 }}>▼</motion.span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>NOTES</span>
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{video.notes?.length || 0}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(video.notes || []).map(note => (
                <div
                  key={note.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}
                >
                  {editingNote === note.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        autoFocus
                        value={editDraft}
                        onChange={e => setEditDraft(e.target.value)}
                        rows={4}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 14, borderRadius: 'var(--radius-sm)', lineHeight: 1.6, resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => saveEdit(note.id)} style={{ padding: '8px 14px', background: 'var(--accent)', color: '#141210', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 13 }}>Save</button>
                        <button onClick={() => setEditingNote(null)} style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 13 }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{note.text}</p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(note.timestamp).toLocaleDateString()}</span>
                        <button onClick={() => { setEditingNote(note.id); setEditDraft(note.text) }} style={{ fontSize: 11, color: 'var(--text-muted)', padding: 0 }}>Edit</button>
                        <button onClick={() => dispatch({ type: 'DELETE_NOTE', payload: { videoId: video.id, noteId: note.id } })} style={{ fontSize: 11, color: 'var(--danger)', padding: 0 }}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote() }}
                placeholder="Add a note, idea, or link..."
                rows={3}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14, borderRadius: 'var(--radius-md)', lineHeight: 1.6, resize: 'vertical' }}
              />
              <button
                onClick={addNote}
                disabled={!draft.trim()}
                style={{
                  padding: '11px',
                  background: draft.trim() ? 'var(--accent-glow)' : 'transparent',
                  border: '1px solid',
                  borderColor: draft.trim() ? 'rgba(196,149,106,0.3)' : 'var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: draft.trim() ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'all 0.2s',
                }}
              >
                Add Note
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Drafts Section ────────────────────────────────
function DraftsSection({ video }) {
  const { dispatch } = React.useContext(AppContext)
  const [open, setOpen] = React.useState(false)
  const [addingLabel, setAddingLabel] = React.useState('')
  const [showAdd, setShowAdd] = React.useState(false)
  const draftFields = video.draftFields || []

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          minHeight: 'var(--touch-min)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.18 }} style={{ color: 'var(--text-muted)', fontSize: 12 }}>▼</motion.span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>DRAFTS</span>
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{draftFields.length}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {draftFields.map(f => (
                <div key={f.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{f.label}</span>
                    <button
                      onClick={() => dispatch({ type: 'DELETE_DRAFT_FIELD', payload: { videoId: video.id, fieldId: f.id } })}
                      style={{ fontSize: 13, color: 'var(--text-muted)', padding: '2px 6px' }}
                    >
                      ×
                    </button>
                  </div>
                  <textarea
                    value={f.content}
                    onChange={e => dispatch({ type: 'UPDATE_DRAFT_CONTENT', payload: { videoId: video.id, fieldId: f.id, content: e.target.value } })}
                    placeholder={`Write your ${f.label.toLowerCase()} here...`}
                    rows={4}
                    style={{ width: '100%', padding: '12px 14px', fontSize: 14, borderRadius: 'var(--radius-md)', lineHeight: 1.6, resize: 'vertical' }}
                  />
                </div>
              ))}

              {showAdd ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    value={addingLabel}
                    onChange={e => setAddingLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && addingLabel.trim()) {
                        dispatch({ type: 'ADD_DRAFT_FIELD', payload: { videoId: video.id, label: addingLabel.trim() } })
                        setAddingLabel(''); setShowAdd(false)
                      }
                      if (e.key === 'Escape') { setShowAdd(false); setAddingLabel('') }
                    }}
                    placeholder="Field name (e.g. Title, Hook)"
                    style={{ flex: 1, padding: '10px 12px', fontSize: 14, borderRadius: 'var(--radius-sm)' }}
                  />
                  <button
                    onClick={() => {
                      if (!addingLabel.trim()) return
                      dispatch({ type: 'ADD_DRAFT_FIELD', payload: { videoId: video.id, label: addingLabel.trim() } })
                      setAddingLabel(''); setShowAdd(false)
                    }}
                    style={{ padding: '10px 14px', background: 'var(--accent)', color: '#141210', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}
                  >
                    Add
                  </button>
                  <button onClick={() => { setShowAdd(false); setAddingLabel('') }} style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdd(true)}
                  style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  + Add draft field
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main EpisodeDetail ────────────────────────────
export default function EpisodeDetail({ videoId, onBack }) {
  const { state, dispatch } = React.useContext(AppContext)
  const video = state.videos.find(v => v.id === videoId)
  const [editingTitle, setEditingTitle] = React.useState(false)
  const [titleDraft, setTitleDraft] = React.useState('')
  const [episodeConfetti, setEpisodeConfetti] = React.useState(0)
  const titleRef = React.useRef(null)
  const prevCompleteRef = React.useRef(false)

  React.useEffect(() => {
    if (video) {
      setTitleDraft(video.title)
      prevCompleteRef.current = isEpisodeComplete(video)
    }
  }, [videoId])

  React.useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus()
  }, [editingTitle])

  if (!video) return null

  const progress = calcProgress(video)
  const seriesObj = state.config.series?.find(s => s.id === video.seriesId)

  function saveTitle() {
    const t = titleDraft.trim()
    if (t && t !== video.title) {
      dispatch({ type: 'UPDATE_VIDEO_TITLE', payload: { videoId, title: t } })
    }
    setEditingTitle(false)
  }

  function handleXP() {
    dispatch({ type: 'GAIN_XP', payload: { action: 'phase_checked', points: 10, episodeId: videoId } })
    // Check episode complete
    setTimeout(() => {
      const updated = state.videos.find(v => v.id === videoId)
      if (updated && isEpisodeComplete(updated) && !prevCompleteRef.current) {
        dispatch({ type: 'GAIN_XP', payload: { action: 'episode_complete', points: 100, episodeId: videoId } })
        setEpisodeConfetti(c => c + 1)
        prevCompleteRef.current = true
      }
    }, 50)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        background: 'var(--bg-primary)',
        zIndex: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button
            onClick={onBack}
            style={{
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 0',
              minHeight: 'var(--touch-min)',
            }}
          >
            ← Back
          </button>

          {/* Series badge */}
          {seriesObj && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: seriesObj.color }} />
              <span className="mono" style={{ color: seriesObj.color, fontSize: 10 }}>{seriesObj.name}</span>
            </div>
          )}
        </div>

        {/* Title */}
        {editingTitle ? (
          <input
            ref={titleRef}
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
            style={{
              width: '100%',
              fontSize: 20,
              fontWeight: 700,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 10,
              letterSpacing: '-0.01em',
            }}
          />
        ) : (
          <h1
            onClick={() => { setTitleDraft(video.title); setEditingTitle(true) }}
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              marginBottom: 10,
              letterSpacing: '-0.01em',
              cursor: 'text',
            }}
          >
            {video.title}
          </h1>
        )}

        {/* Progress */}
        <ProgressBar progress={progress} height={7} showLabel />
      </div>

      {/* Confetti for episode complete */}
      <ConfettiBurst trigger={episodeConfetti} count={60} fullScreen />

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Status row */}
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status:</span>
          <button
            onClick={() => dispatch({ type: 'CYCLE_VIDEO_STATUS', payload: { videoId } })}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              fontSize: 12,
              fontWeight: 600,
              borderColor: (state.config.statuses.find(s => s.id === video.statusId)?.color || 'var(--accent)') + '55',
              color: state.config.statuses.find(s => s.id === video.statusId)?.color || 'var(--accent)',
              background: (state.config.statuses.find(s => s.id === video.statusId)?.color || 'var(--accent)') + '18',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {state.config.statuses.find(s => s.id === video.statusId)?.label || 'Unknown'}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(tap to advance)</span>
        </div>

        {/* Lifecycle sections */}
        <LifecycleSection
          video={video}
          sectionKey="productionItems"
          label="Production"
          items={video.productionItems || []}
          isPlatform={false}
          onXP={handleXP}
        />
        <LifecycleSection
          video={video}
          sectionKey="postingPrepItems"
          label="Posting Prep"
          items={video.postingPrepItems || []}
          isPlatform={false}
          onXP={handleXP}
        />
        <LifecycleSection
          video={video}
          sectionKey="platforms"
          label="Distribution"
          items={video.platforms || []}
          isPlatform={true}
          onXP={handleXP}
        />

        {/* Notes */}
        <NotesSection video={video} />

        {/* Drafts */}
        <DraftsSection video={video} />

        {/* Delete episode */}
        <div style={{ padding: '20px 20px 40px' }}>
          <button
            onClick={() => {
              if (window.confirm('Delete this episode? This cannot be undone.')) {
                dispatch({ type: 'DELETE_VIDEO', payload: { videoId } })
                onBack()
              }
            }}
            style={{
              width: '100%',
              padding: '13px',
              border: '1px solid var(--danger-dim)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Delete Episode
          </button>
        </div>
      </div>
    </motion.div>
  )
}

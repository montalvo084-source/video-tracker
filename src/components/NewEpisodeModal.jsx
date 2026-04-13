import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext, uid, createVideo } from '../hooks/useAppState'

export default function NewEpisodeModal({ isOpen, onClose, onCreated, appliedTemplate }) {
  const { state, dispatch } = React.useContext(AppContext)
  const { config } = state
  const [title, setTitle] = React.useState('')
  const [selectedSeriesId, setSelectedSeriesId] = React.useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(null)
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (isOpen) {
      setTitle('')
      setSelectedSeriesId(null)
      setSelectedTemplateId(appliedTemplate?.id || null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, appliedTemplate])

  function handleCreate() {
    const t = title.trim() || 'Untitled Episode'
    const template = selectedTemplateId
      ? config.workflowTemplates?.find(wt => wt.id === selectedTemplateId)
      : null

    const overrides = template
      ? {
          title: t,
          seriesId: selectedSeriesId,
          productionItems: template.productionItems.map(i => ({ ...i, id: uid('pi'), checked: false })),
          postingPrepItems: template.postingPrepItems.map(i => ({ ...i, id: uid('pp'), checked: false })),
          platforms: template.platforms.map(i => ({ ...i, id: uid('pl'), posted: false })),
          draftFields: template.draftFields.map(i => ({ ...i, id: uid('df'), content: '' })),
        }
      : { title: t, seriesId: selectedSeriesId }

    const video = createVideo(config, overrides)
    dispatch({ type: 'ADD_VIDEO', payload: { video } })
    onCreated(video.id)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              zIndex: 50,
              padding: '20px 20px 40px',
              boxShadow: 'var(--shadow-elevated)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>

            <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginBottom: 4 }}>
              New Episode
            </h2>

            {/* Title input */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Title</label>
              <input
                ref={inputRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="What's this episode about?"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: 16,
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 500,
                }}
              />
            </div>

            {/* Series picker */}
            {config.series?.length > 0 && (
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Series (optional)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedSeriesId(null)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid',
                      fontSize: 13,
                      borderColor: !selectedSeriesId ? 'var(--accent)' : 'var(--border)',
                      color: !selectedSeriesId ? 'var(--accent)' : 'var(--text-muted)',
                      background: !selectedSeriesId ? 'var(--accent-glow)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    None
                  </button>
                  {config.series.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeriesId(s.id)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid',
                        fontSize: 13,
                        borderColor: selectedSeriesId === s.id ? s.color : 'var(--border)',
                        color: selectedSeriesId === s.id ? s.color : 'var(--text-muted)',
                        background: selectedSeriesId === s.id ? s.color + '20' : 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow template picker */}
            {(config.workflowTemplates?.length || 0) > 0 && (
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Workflow (optional)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedTemplateId(null)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid',
                      fontSize: 13,
                      borderColor: !selectedTemplateId ? 'var(--accent)' : 'var(--border)',
                      color: !selectedTemplateId ? 'var(--accent)' : 'var(--text-muted)',
                      background: !selectedTemplateId ? 'var(--accent-glow)' : 'transparent',
                    }}
                  >
                    Default
                  </button>
                  {config.workflowTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid',
                        fontSize: 13,
                        borderColor: selectedTemplateId === t.id ? 'var(--accent)' : 'var(--border)',
                        color: selectedTemplateId === t.id ? 'var(--accent)' : 'var(--text-muted)',
                        background: selectedTemplateId === t.id ? 'var(--accent-glow)' : 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create button */}
            <motion.button
              onClick={handleCreate}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%',
                padding: '15px',
                background: 'var(--accent)',
                color: '#141210',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: 16,
                marginTop: 4,
              }}
            >
              Create Episode
            </motion.button>

            <button
              onClick={onClose}
              style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

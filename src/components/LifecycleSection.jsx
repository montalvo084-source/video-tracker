import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext, uid } from '../hooks/useAppState'
import PhaseItem from './PhaseItem'
import ConfettiBurst from './ConfettiBurst'

export default function LifecycleSection({ video, sectionKey, label, items, isPlatform, onXP }) {
  const { dispatch } = React.useContext(AppContext)
  const [open, setOpen] = React.useState(true)
  const [addingLabel, setAddingLabel] = React.useState('')
  const [showAdd, setShowAdd] = React.useState(false)
  const [sectionConfetti, setSectionConfetti] = React.useState(0)
  const addInputRef = React.useRef(null)

  const doneCount = isPlatform
    ? items.filter(i => i.posted).length
    : items.filter(i => i.checked).length
  const total = items.length
  const sectionComplete = total > 0 && doneCount === total

  React.useEffect(() => {
    if (showAdd && addInputRef.current) addInputRef.current.focus()
  }, [showAdd])

  function handleAddItem() {
    const label = addingLabel.trim()
    if (!label) return
    if (isPlatform) {
      dispatch({ type: 'ADD_PLATFORM', payload: { videoId: video.id, label } })
    } else {
      dispatch({ type: 'ADD_ITEM', payload: { videoId: video.id, listKey: sectionKey, label } })
    }
    setAddingLabel('')
    setShowAdd(false)
  }

  function handleXP() {
    onXP?.()
    // Check if section just completed
    const willDone = doneCount + 1
    if (willDone === total) {
      setSectionConfetti(c => c + 1)
    }
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'none',
          cursor: 'pointer',
          minHeight: 'var(--touch-min)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.span
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ duration: 0.18 }}
            style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block' }}
          >
            ▼
          </motion.span>
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: sectionComplete ? 'var(--success)' : 'var(--text-secondary)',
              letterSpacing: '0.06em',
            }}
          >
            {label.toUpperCase()}
          </span>
          {sectionComplete && <span style={{ fontSize: 12 }}>✓</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: sectionComplete ? 'var(--success)' : doneCount > 0 ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {doneCount}/{total}
          </span>
        </div>
      </button>

      {/* Confetti for section complete */}
      <div style={{ position: 'relative', height: 0 }}>
        <ConfettiBurst trigger={sectionConfetti} count={20} />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 8px' }}>
              {items.map((item, i) => (
                <PhaseItem
                  key={item.id}
                  item={item}
                  videoId={video.id}
                  listKey={sectionKey}
                  isPlatform={isPlatform}
                  isFirst={i === 0}
                  isLast={i === items.length - 1}
                  onXP={handleXP}
                />
              ))}

              {/* Add item row */}
              {showAdd ? (
                <div style={{ display: 'flex', gap: 8, padding: '8px 0 4px' }}>
                  <input
                    ref={addInputRef}
                    value={addingLabel}
                    onChange={e => setAddingLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddItem()
                      if (e.key === 'Escape') { setShowAdd(false); setAddingLabel('') }
                    }}
                    placeholder="Add step..."
                    style={{ flex: 1, padding: '10px 12px', fontSize: 14, borderRadius: 'var(--radius-sm)' }}
                  />
                  <button
                    onClick={handleAddItem}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--accent)',
                      color: '#141210',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowAdd(false); setAddingLabel('') }}
                    style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: 14 }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdd(true)}
                  style={{
                    padding: '8px 0',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 2,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  + Add step
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

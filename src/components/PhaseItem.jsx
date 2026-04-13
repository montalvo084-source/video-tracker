import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext } from '../hooks/useAppState'

export default function PhaseItem({ item, videoId, listKey, isPlatform, isFirst, isLast, onXP }) {
  const { dispatch } = React.useContext(AppContext)
  const [editing, setEditing] = React.useState(false)
  const [showActions, setShowActions] = React.useState(false)
  const [draft, setDraft] = React.useState(item.label)
  const [burst, setBurst] = React.useState(false)
  const inputRef = React.useRef(null)

  const checked = isPlatform ? item.posted : item.checked

  React.useEffect(() => {
    if (!editing) setDraft(item.label)
  }, [item.label, editing])

  React.useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  function handleToggle() {
    if (isPlatform) {
      dispatch({ type: 'TOGGLE_PLATFORM', payload: { videoId, platformId: item.id } })
    } else {
      dispatch({ type: 'TOGGLE_ITEM', payload: { videoId, listKey, itemId: item.id } })
    }
    dispatch({ type: 'TOUCH_VIDEO', payload: { videoId } })
    if (!checked) {
      setBurst(true)
      setTimeout(() => setBurst(false), 500)
      onXP?.()
    }
  }

  function saveLabel() {
    const trimmed = draft.trim()
    if (!trimmed) { setEditing(false); setDraft(item.label); return }
    if (isPlatform) {
      dispatch({ type: 'UPDATE_PLATFORM_LABEL', payload: { videoId, platformId: item.id, label: trimmed } })
    } else {
      dispatch({ type: 'UPDATE_ITEM_LABEL', payload: { videoId, listKey, itemId: item.id, label: trimmed } })
    }
    setEditing(false)
  }

  function handleDelete() {
    if (isPlatform) {
      dispatch({ type: 'DELETE_PLATFORM', payload: { videoId, platformId: item.id } })
    } else {
      dispatch({ type: 'DELETE_ITEM', payload: { videoId, listKey, itemId: item.id } })
    }
  }

  function handleReorder(dir) {
    if (isPlatform) {
      dispatch({ type: 'REORDER_PLATFORM', payload: { videoId, platformId: item.id, direction: dir } })
    } else {
      dispatch({ type: 'REORDER_ITEM', payload: { videoId, listKey, itemId: item.id, direction: dir } })
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <motion.div
        layout
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 4px',
          borderRadius: 'var(--radius-sm)',
          transition: 'background 0.15s',
        }}
      >
        {/* Checkbox — 44px tap target wrapping a 26px visual circle */}
        <button
          onClick={handleToggle}
          style={{
            padding: 9,
            margin: -9,
            flexShrink: 0,
            borderRadius: '50%',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            animate={burst ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid',
              borderColor: checked ? 'var(--success)' : 'var(--border)',
              background: checked ? 'var(--success)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            {checked && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                width="11" height="11" viewBox="0 0 12 12"
                fill="none" stroke="#141210" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="2,6 5,9 10,3" />
              </motion.svg>
            )}
          </motion.div>
        </button>

        {/* Label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={e => {
                if (e.key === 'Enter') saveLabel()
                if (e.key === 'Escape') { setEditing(false); setDraft(item.label) }
              }}
              style={{
                width: '100%',
                padding: '4px 8px',
                fontSize: 15,
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-input)',
                border: '1px solid var(--accent)',
              }}
            />
          ) : (
            <span
              onDoubleClick={() => setEditing(true)}
              style={{
                fontSize: 15,
                color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: checked ? 'line-through' : 'none',
                transition: 'all 0.2s',
                display: 'block',
                wordBreak: 'break-word',
                lineHeight: 1.4,
              }}
            >
              {item.label}
            </span>
          )}
        </div>

        {/* Actions — hidden behind ⋯ to prevent accidental taps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {showActions ? (
            <>
              {!isFirst && (
                <button
                  onClick={() => handleReorder('up')}
                  style={{ minWidth: 44, minHeight: 44, color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ↑
                </button>
              )}
              {!isLast && (
                <button
                  onClick={() => handleReorder('down')}
                  style={{ minWidth: 44, minHeight: 44, color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ↓
                </button>
              )}
              <button
                onClick={() => { setEditing(true); setShowActions(false) }}
                style={{ minWidth: 44, minHeight: 44, color: 'var(--accent)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✎
              </button>
              <button
                onClick={handleDelete}
                style={{ minWidth: 44, minHeight: 44, color: 'var(--danger)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
              <button
                onClick={() => setShowActions(false)}
                style={{ minWidth: 44, minHeight: 44, color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowActions(true)}
              style={{
                minWidth: 44, minHeight: 44,
                color: 'var(--text-muted)',
                fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                letterSpacing: '-2px',
              }}
            >
              ···
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

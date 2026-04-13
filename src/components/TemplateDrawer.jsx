import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext, uid } from '../hooks/useAppState'

const CATEGORIES = ['All', 'AI Prompts', 'Descriptions', 'CTAs', 'Hashtags', 'Scripts', 'General']

// ── Snippet Card ──────────────────────────────────
function SnippetCard({ snippet, onCopy, onEdit, onDelete }) {
  const [copied, setCopied] = React.useState(false)
  const [longPressTimer, setLongPressTimer] = React.useState(null)
  const [showMenu, setShowMenu] = React.useState(false)

  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(snippet.body).catch(() => {})
    onCopy(snippet.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handlePressStart() {
    const t = setTimeout(() => setShowMenu(true), 500)
    setLongPressTimer(t)
  }
  function handlePressEnd() {
    clearTimeout(longPressTimer)
  }

  return (
    <div
      style={{ position: 'relative' }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <motion.div
        whileTap={{ scale: 0.98 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          cursor: 'pointer',
        }}
      >
        {/* Category chip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="mono" style={{ color: 'var(--accent)', fontSize: 9 }}>{snippet.category?.toUpperCase()}</span>
          {snippet.usageCount > 0 && (
            <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 9 }}>used {snippet.usageCount}×</span>
          )}
        </div>

        {/* Title */}
        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {snippet.title}
        </p>

        {/* Body preview */}
        <p style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {snippet.body}
        </p>

        {/* Copy button */}
        <motion.button
          onClick={handleCopy}
          whileTap={{ scale: 0.94 }}
          style={{
            marginTop: 4,
            padding: '8px 0',
            background: copied ? 'var(--success-glow)' : 'var(--accent-glow)',
            border: '1px solid',
            borderColor: copied ? 'rgba(90,143,90,0.4)' : 'rgba(196,149,106,0.25)',
            borderRadius: 'var(--radius-sm)',
            color: copied ? 'var(--success)' : 'var(--accent)',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </motion.button>
      </motion.div>

      {/* Long-press context menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 50 }}
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 51,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                minWidth: 120,
                boxShadow: 'var(--shadow-elevated)',
              }}
            >
              <button
                onClick={() => { onEdit(snippet); setShowMenu(false) }}
                style={{ width: '100%', padding: '12px 16px', textAlign: 'left', color: 'var(--text-primary)', fontSize: 14 }}
              >
                Edit
              </button>
              <button
                onClick={() => { onDelete(snippet.id); setShowMenu(false) }}
                style={{ width: '100%', padding: '12px 16px', textAlign: 'left', color: 'var(--danger)', fontSize: 14, borderTop: '1px solid var(--border)' }}
              >
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Snippet Form ──────────────────────────────────
function SnippetForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = React.useState(initial?.title || '')
  const [body, setBody] = React.useState(initial?.body || '')
  const [category, setCategory] = React.useState(initial?.category || 'General')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 20px 20px' }}>
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Snippet title"
        style={{ padding: '12px 14px', fontSize: 15, borderRadius: 'var(--radius-md)', width: '100%' }}
      />
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        style={{
          padding: '12px 14px',
          fontSize: 14,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          outline: 'none',
        }}
      >
        {CATEGORIES.filter(c => c !== 'All').map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Paste your template text here..."
        rows={5}
        style={{ padding: '12px 14px', fontSize: 14, borderRadius: 'var(--radius-md)', resize: 'vertical', lineHeight: 1.6, width: '100%' }}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: '13px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14 }}
        >
          Cancel
        </button>
        <button
          onClick={() => title.trim() && body.trim() && onSave({ title: title.trim(), body: body.trim(), category })}
          style={{
            flex: 2,
            padding: '13px',
            borderRadius: 'var(--radius-md)',
            background: title.trim() && body.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
            color: title.trim() && body.trim() ? '#141210' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: 14,
            transition: 'all 0.2s',
          }}
        >
          Save Snippet
        </button>
      </div>
    </div>
  )
}

// ── Workflow Tab ──────────────────────────────────
function WorkflowTab({ templates, config, onApply }) {
  const { dispatch } = React.useContext(AppContext)
  const [addingName, setAddingName] = React.useState('')
  const [showAdd, setShowAdd] = React.useState(false)

  function handleSaveTemplate() {
    if (!addingName.trim()) return
    dispatch({
      type: 'ADD_WORKFLOW_TEMPLATE',
      payload: {
        name: addingName.trim(),
        productionItems: config.defaultProductionItems.map(i => ({ id: uid('pi'), label: i.label, checked: false })),
        postingPrepItems: config.defaultPostingPrepItems.map(i => ({ id: uid('pp'), label: i.label, checked: false })),
        platforms: config.defaultPlatforms.map(i => ({ id: uid('pl'), label: i.label, posted: false })),
        draftFields: config.defaultDraftFields.map(i => ({ id: uid('df'), label: i.label, content: '' })),
      }
    })
    setAddingName('')
    setShowAdd(false)
  }

  return (
    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {templates.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
          No workflow templates yet.<br />Save your current checklist setup as a reusable template.
        </div>
      )}

      {templates.map(t => (
        <div
          key={t.id}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{t.name}</p>
            <p className="mono" style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 3 }}>
              {(t.productionItems?.length || 0) + (t.postingPrepItems?.length || 0)} steps · {t.platforms?.length || 0} platforms
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onApply(t)}
              style={{
                padding: '8px 14px',
                background: 'var(--accent-glow)',
                border: '1px solid rgba(196,149,106,0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Use
            </button>
            <button
              onClick={() => dispatch({ type: 'DELETE_WORKFLOW_TEMPLATE', payload: { id: t.id } })}
              style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 12 }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {showAdd ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          display: 'flex',
          gap: 8,
        }}>
          <input
            autoFocus
            value={addingName}
            onChange={e => setAddingName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
            placeholder="Template name (e.g. Long-form video)"
            style={{ flex: 1, padding: '10px 12px', fontSize: 14, borderRadius: 'var(--radius-sm)' }}
          />
          <button
            onClick={handleSaveTemplate}
            style={{ padding: '10px 14px', background: 'var(--accent)', color: '#141210', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 13 }}
          >
            Save
          </button>
          <button onClick={() => setShowAdd(false)} style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 13 }}>✕</button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: '100%',
            padding: '13px',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          + Save Current Defaults as Template
        </button>
      )}
    </div>
  )
}

// ── Main TemplateDrawer ───────────────────────────
export default function TemplateDrawer({ isOpen, onClose, onApplyWorkflow }) {
  const { state, dispatch } = React.useContext(AppContext)
  const { config } = state
  const snippets = config.snippets || []
  const workflowTemplates = config.workflowTemplates || []

  const [activeTab, setActiveTab] = React.useState('snippets')
  const [search, setSearch] = React.useState('')
  const [activeCategory, setActiveCategory] = React.useState('All')
  const [editingSnippet, setEditingSnippet] = React.useState(null)
  const [showForm, setShowForm] = React.useState(false)

  // Filter snippets
  const filtered = snippets
    .filter(s => activeCategory === 'All' || s.category === activeCategory)
    .filter(s => {
      if (!search) return true
      const q = search.toLowerCase()
      return s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (a.lastUsed && b.lastUsed) return b.lastUsed - a.lastUsed
      if (a.lastUsed) return -1
      if (b.lastUsed) return 1
      return b.createdAt - a.createdAt
    })

  function handleSaveSnippet({ title, body, category }) {
    if (editingSnippet) {
      dispatch({ type: 'EDIT_SNIPPET', payload: { id: editingSnippet.id, title, body, category } })
    } else {
      dispatch({ type: 'ADD_SNIPPET', payload: { title, body, category } })
    }
    setShowForm(false)
    setEditingSnippet(null)
  }

  function handleEdit(snippet) {
    setEditingSnippet(snippet)
    setShowForm(true)
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_SNIPPET', payload: { id } })
  }

  function handleCopy(id) {
    dispatch({ type: 'USE_SNIPPET', payload: { id } })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => { if (info.offset.y > 100) onClose() }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '90dvh',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-elevated)',
              touchAction: 'none',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>

            {/* Header */}
            <div style={{ padding: '4px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>Templates</h2>
              <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 20, padding: '4px 8px' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              padding: '0 20px',
              gap: 4,
              borderBottom: '1px solid var(--border)',
              marginBottom: 0,
            }}>
              {['snippets', 'workflows'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 16px',
                    fontWeight: activeTab === tab ? 700 : 400,
                    fontSize: 14,
                    color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                    marginBottom: -1,
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div style={{ flex: 1, overflowY: 'auto', touchAction: 'pan-y' }}>
              {activeTab === 'snippets' && (
                <div style={{ paddingTop: 14 }}>
                  {showForm ? (
                    <SnippetForm
                      initial={editingSnippet}
                      onSave={handleSaveSnippet}
                      onCancel={() => { setShowForm(false); setEditingSnippet(null) }}
                    />
                  ) : (
                    <>
                      {/* Search */}
                      <div style={{ padding: '0 20px 10px' }}>
                        <input
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Search snippets..."
                          style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 'var(--radius-md)' }}
                        />
                      </div>

                      {/* Category chips */}
                      <div className="scroll-row" style={{ padding: '0 20px 12px' }}>
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className="mono"
                            style={{
                              flexShrink: 0,
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 10,
                              border: '1px solid',
                              borderColor: activeCategory === cat ? 'var(--accent)' : 'var(--border)',
                              background: activeCategory === cat ? 'var(--accent-glow)' : 'transparent',
                              color: activeCategory === cat ? 'var(--accent)' : 'var(--text-muted)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {cat.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      {/* Grid */}
                      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {filtered.map(s => (
                          <SnippetCard
                            key={s.id}
                            snippet={s}
                            onCopy={handleCopy}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>

                      {filtered.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
                          {search ? 'No snippets match your search.' : 'No snippets yet. Add your first one!'}
                        </div>
                      )}

                      {/* Add button */}
                      <div style={{ padding: '16px 20px 20px' }}>
                        <button
                          onClick={() => { setEditingSnippet(null); setShowForm(true) }}
                          style={{
                            width: '100%',
                            padding: '13px',
                            border: '1px dashed var(--border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-muted)',
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}
                        >
                          + Add Snippet
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'workflows' && (
                <div style={{ paddingTop: 14 }}>
                  <WorkflowTab
                    templates={workflowTemplates}
                    config={config}
                    onApply={onApplyWorkflow}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

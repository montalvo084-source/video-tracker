// ============================================================
// VideoTracker.jsx — Video Tracker app (local Vite build)
// Tier 1: Full foundation + everything editable inline
// ============================================================

import React from 'react'

const SERIES_PALETTE = ["#7B9EC4", "#B07CC6", "#76AE8C", "#C47B7B", "#A8B87B", "#9B7BC4"]

// ─────────────────────────────────────────────
// STORAGE & DEFAULTS
// ─────────────────────────────────────────────


const DEFAULT_STATE = {
  config: {
    statuses: [
      { id: "s1", label: "Idea",          color: "#8B7355" },
      { id: "s2", label: "Filming",       color: "#C4956A" },
      { id: "s3", label: "Editing",       color: "#D4A574" },
      { id: "s4", label: "Ready to Post", color: "#7CAE7A" },
      { id: "s5", label: "Posted",        color: "#5A8F5A" },
    ],
    sectionLabels: {
      brainDump:   "Brain Dump",
      content:     "Content",
      production:  "Production",
      postingPrep: "Posting Prep",
      postedTo:    "Posted To",
    },
    defaultProductionItems: [
      { id: "dpi_1", label: "Attention Grabber / Hook" },
      { id: "dpi_2", label: "Intro" },
      { id: "dpi_3", label: "Middle / Core Content" },
      { id: "dpi_4", label: "Ending / CTA" },
    ],
    defaultPostingPrepItems: [
      { id: "dpp_1", label: "Thumbnail" },
      { id: "dpp_2", label: "Title" },
      { id: "dpp_3", label: "Description" },
      { id: "dpp_4", label: "Tags / Keywords" },
    ],
    defaultPlatforms: [
      { id: "dpl_1", label: "YouTube" },
      { id: "dpl_2", label: "Facebook" },
      { id: "dpl_3", label: "Instagram" },
      { id: "dpl_4", label: "TikTok" },
      { id: "dpl_5", label: "X / Twitter" },
    ],
    defaultDraftFields: [
      { id: "ddf_1", label: "Title" },
      { id: "ddf_2", label: "Description" },
    ],
    series: [],
  },
  videos: [],
}

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function calcProgress(video) {
  const total =
    video.productionItems.length +
    video.postingPrepItems.length +
    video.platforms.length
  if (total === 0) return 0
  const done =
    video.productionItems.filter(i => i.checked).length +
    video.postingPrepItems.filter(i => i.checked).length +
    video.platforms.filter(p => p.posted).length
  return done / total
}

function createVideo(config) {
  return {
    id: uid("v"),
    title: "Untitled Video",
    statusId: config.statuses[0].id,
    createdAt: new Date().toISOString(),
    notes: [],
    productionItems:  config.defaultProductionItems.map(item => ({ id: uid("pi"), label: item.label, checked: false })),
    postingPrepItems: config.defaultPostingPrepItems.map(item => ({ id: uid("pp"), label: item.label, checked: false })),
    platforms:        config.defaultPlatforms.map(item => ({ id: uid("pl"), label: item.label, posted: false })),
    draftFields:      (config.defaultDraftFields || []).map(item => ({ id: uid("df"), label: item.label, content: "" })),
    seriesId:         null,
  }
}

function migrateDefaultList(list) {
  if (!Array.isArray(list)) return []
  return list.map((item, i) =>
    typeof item === "string" ? { id: `migrated_${i}_${Date.now()}`, label: item } : item
  )
}


// ─────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────

function reducer(state, action) {
  const { type, payload } = action

  switch (type) {
    // ── Video CRUD ─────────────────────────────
    case "ADD_VIDEO": {
      return { ...state, videos: [...state.videos, payload.video] }
    }
    case "DELETE_VIDEO": {
      return { ...state, videos: state.videos.filter(v => v.id !== payload.videoId) }
    }
    case "UPDATE_VIDEO_TITLE": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId ? { ...v, title: payload.title } : v
        ),
      }
    }
    case "CYCLE_VIDEO_STATUS": {
      const { statuses } = state.config
      return {
        ...state,
        videos: state.videos.map(v => {
          if (v.id !== payload.videoId) return v
          const idx = statuses.findIndex(s => s.id === v.statusId)
          return { ...v, statusId: statuses[(idx + 1) % statuses.length].id }
        }),
      }
    }

    // ── Notes ──────────────────────────────────
    case "ADD_NOTE": {
      const note = { id: uid("n"), text: payload.text, timestamp: new Date().toISOString() }
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId ? { ...v, notes: [...v.notes, note] } : v
        ),
      }
    }
    case "DELETE_NOTE": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? { ...v, notes: v.notes.filter(n => n.id !== payload.noteId) }
            : v
        ),
      }
    }
    case "EDIT_NOTE": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? { ...v, notes: v.notes.map(n => n.id === payload.noteId ? { ...n, text: payload.text } : n) }
            : v
        ),
      }
    }

    // ── Checklist items (productionItems | postingPrepItems) ───
    case "ADD_ITEM": {
      const { videoId, listKey, label } = payload
      const newItem = { id: uid("item"), label, checked: false }
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === videoId ? { ...v, [listKey]: [...v[listKey], newItem] } : v
        ),
      }
    }
    case "TOGGLE_ITEM": {
      const { videoId, listKey, itemId } = payload
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === videoId
            ? { ...v, [listKey]: v[listKey].map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
            : v
        ),
      }
    }
    case "UPDATE_ITEM_LABEL": {
      const { videoId, listKey, itemId, label } = payload
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === videoId
            ? { ...v, [listKey]: v[listKey].map(i => i.id === itemId ? { ...i, label } : i) }
            : v
        ),
      }
    }
    case "DELETE_ITEM": {
      const { videoId, listKey, itemId } = payload
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === videoId
            ? { ...v, [listKey]: v[listKey].filter(i => i.id !== itemId) }
            : v
        ),
      }
    }
    case "REORDER_ITEM": {
      const { videoId, listKey, itemId, direction } = payload
      return {
        ...state,
        videos: state.videos.map(v => {
          if (v.id !== videoId) return v
          const items = [...v[listKey]]
          const idx = items.findIndex(i => i.id === itemId)
          const newIdx = direction === "up" ? idx - 1 : idx + 1
          if (newIdx < 0 || newIdx >= items.length) return v
          ;[items[idx], items[newIdx]] = [items[newIdx], items[idx]]
          return { ...v, [listKey]: items }
        }),
      }
    }

    // ── Platforms ──────────────────────────────
    case "ADD_PLATFORM": {
      const newPlatform = { id: uid("pl"), label: payload.label, posted: false }
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId ? { ...v, platforms: [...v.platforms, newPlatform] } : v
        ),
      }
    }
    case "TOGGLE_PLATFORM": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? { ...v, platforms: v.platforms.map(p => p.id === payload.platformId ? { ...p, posted: !p.posted } : p) }
            : v
        ),
      }
    }
    case "UPDATE_PLATFORM_LABEL": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? { ...v, platforms: v.platforms.map(p => p.id === payload.platformId ? { ...p, label: payload.label } : p) }
            : v
        ),
      }
    }
    case "DELETE_PLATFORM": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? { ...v, platforms: v.platforms.filter(p => p.id !== payload.platformId) }
            : v
        ),
      }
    }
    case "REORDER_PLATFORM": {
      return {
        ...state,
        videos: state.videos.map(v => {
          if (v.id !== payload.videoId) return v
          const platforms = [...v.platforms]
          const idx = platforms.findIndex(p => p.id === payload.platformId)
          const newIdx = payload.direction === "up" ? idx - 1 : idx + 1
          if (newIdx < 0 || newIdx >= platforms.length) return v
          ;[platforms[idx], platforms[newIdx]] = [platforms[newIdx], platforms[idx]]
          return { ...v, platforms }
        }),
      }
    }

    // ── Default template items ──────────────────
    // listKey: "defaultProductionItems" | "defaultPostingPrepItems" | "defaultPlatforms"
    case "ADD_DEFAULT_ITEM": {
      const newItem = { id: uid("d"), label: payload.label }
      return {
        ...state,
        config: { ...state.config, [payload.listKey]: [...state.config[payload.listKey], newItem] },
      }
    }
    case "UPDATE_DEFAULT_ITEM_LABEL": {
      return {
        ...state,
        config: {
          ...state.config,
          [payload.listKey]: state.config[payload.listKey].map(i =>
            i.id === payload.itemId ? { ...i, label: payload.label } : i
          ),
        },
      }
    }
    case "DELETE_DEFAULT_ITEM": {
      return {
        ...state,
        config: {
          ...state.config,
          [payload.listKey]: state.config[payload.listKey].filter(i => i.id !== payload.itemId),
        },
      }
    }
    case "REORDER_DEFAULT_ITEM": {
      const list = [...state.config[payload.listKey]]
      const idx = list.findIndex(i => i.id === payload.itemId)
      const newIdx = payload.direction === "up" ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= list.length) return state
      ;[list[idx], list[newIdx]] = [list[newIdx], list[idx]]
      return { ...state, config: { ...state.config, [payload.listKey]: list } }
    }

    // ── Draft fields (per-video text areas) ────
    case "ADD_DRAFT_FIELD": {
      const newField = { id: uid("df"), label: payload.label, content: "" }
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId ? { ...v, draftFields: [...(v.draftFields || []), newField] } : v
        ),
      }
    }
    case "UPDATE_DRAFT_CONTENT": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? { ...v, draftFields: (v.draftFields || []).map(f => f.id === payload.fieldId ? { ...f, content: payload.content } : f) }
            : v
        ),
      }
    }
    case "UPDATE_DRAFT_LABEL": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? { ...v, draftFields: (v.draftFields || []).map(f => f.id === payload.fieldId ? { ...f, label: payload.label } : f) }
            : v
        ),
      }
    }
    case "DELETE_DRAFT_FIELD": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? { ...v, draftFields: (v.draftFields || []).filter(f => f.id !== payload.fieldId) }
            : v
        ),
      }
    }
    case "REORDER_DRAFT_FIELD": {
      return {
        ...state,
        videos: state.videos.map(v => {
          if (v.id !== payload.videoId) return v
          const fields = [...(v.draftFields || [])]
          const idx = fields.findIndex(f => f.id === payload.fieldId)
          const newIdx = payload.direction === "up" ? idx - 1 : idx + 1
          if (newIdx < 0 || newIdx >= fields.length) return v
          ;[fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]]
          return { ...v, draftFields: fields }
        }),
      }
    }

    // ── Default draft fields (template) ────────
    case "ADD_DEFAULT_DRAFT": {
      const newItem = { id: uid("ddf"), label: payload.label }
      return { ...state, config: { ...state.config, defaultDraftFields: [...(state.config.defaultDraftFields || []), newItem] } }
    }
    case "UPDATE_DEFAULT_DRAFT_LABEL": {
      return {
        ...state,
        config: {
          ...state.config,
          defaultDraftFields: (state.config.defaultDraftFields || []).map(f =>
            f.id === payload.fieldId ? { ...f, label: payload.label } : f
          ),
        },
      }
    }
    case "DELETE_DEFAULT_DRAFT": {
      return {
        ...state,
        config: { ...state.config, defaultDraftFields: (state.config.defaultDraftFields || []).filter(f => f.id !== payload.fieldId) },
      }
    }
    case "REORDER_DEFAULT_DRAFT": {
      const list = [...(state.config.defaultDraftFields || [])]
      const idx = list.findIndex(f => f.id === payload.fieldId)
      const newIdx = payload.direction === "up" ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= list.length) return state
      ;[list[idx], list[newIdx]] = [list[newIdx], list[idx]]
      return { ...state, config: { ...state.config, defaultDraftFields: list } }
    }

    // ── Series ─────────────────────────────────
    case "ADD_SERIES": {
      const seriesIdx = (state.config.series || []).length % SERIES_PALETTE.length
      const newSeries = { id: payload.id || uid("sr"), name: payload.name, color: SERIES_PALETTE[seriesIdx] }
      return { ...state, config: { ...state.config, series: [...(state.config.series || []), newSeries] } }
    }
    case "UPDATE_SERIES_NAME": {
      return {
        ...state,
        config: {
          ...state.config,
          series: state.config.series.map(s => s.id === payload.seriesId ? { ...s, name: payload.name } : s),
        },
      }
    }
    case "DELETE_SERIES": {
      return {
        ...state,
        config: { ...state.config, series: state.config.series.filter(s => s.id !== payload.seriesId) },
        videos: state.videos.map(v => v.seriesId === payload.seriesId ? { ...v, seriesId: null } : v),
      }
    }
    case "SET_VIDEO_SERIES": {
      return {
        ...state,
        videos: state.videos.map(v => v.id === payload.videoId ? { ...v, seriesId: payload.seriesId } : v),
      }
    }

    // ── Load full state (initial fetch from server)
    case "LOAD_STATE": {
      return { ...payload }
    }

    // ── Config ─────────────────────────────────
    case "UPDATE_STATUS_LABEL": {
      return {
        ...state,
        config: {
          ...state.config,
          statuses: state.config.statuses.map(s =>
            s.id === payload.statusId ? { ...s, label: payload.label } : s
          ),
        },
      }
    }
    case "UPDATE_SECTION_LABEL": {
      return {
        ...state,
        config: {
          ...state.config,
          sectionLabels: { ...state.config.sectionLabels, [payload.sectionKey]: payload.label },
        },
      }
    }

    default:
      return state
  }
}

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

const AppContext = React.createContext(null)

// ─────────────────────────────────────────────
// PROGRESS RING
// ─────────────────────────────────────────────

function ProgressRing({ progress, size = 48, strokeWidth = 4 }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)))
  const color = progress >= 1 ? "#5A8F5A" : "#C4956A"
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A2520" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.4s ease" }}
      />
    </svg>
  )
}

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────

function StatusBadge({ statusId, statuses, onCycle }) {
  const status = statuses.find(s => s.id === statusId) || statuses[0]
  return (
    <button
      onClick={onCycle}
      title="Click to advance status"
      className="text-xs px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
      style={{
        color: status.color,
        borderColor: status.color + "55",
        background: status.color + "18",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {status.label}
    </button>
  )
}

// ─────────────────────────────────────────────
// CONFIRM MODAL
// ─────────────────────────────────────────────

function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-xl p-6 max-w-sm w-full mx-4 border"
        style={{ background: "#1C1916", borderColor: "#2A2520" }}
        onClick={e => e.stopPropagation()}
      >
        <p className="mb-6" style={{ color: "#E8DDD0" }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm transition-colors"
            style={{ color: "#8B7355" }}
            onMouseEnter={e => e.target.style.color = "#E8DDD0"}
            onMouseLeave={e => e.target.style.color = "#8B7355"}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg border transition-colors"
            style={{ background: "rgba(127,29,29,0.35)", color: "#fca5a5", borderColor: "rgba(127,29,29,0.5)" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// CHECKLIST ITEM
// ─────────────────────────────────────────────

function ChecklistItem({ item, videoId, listKey, isFirst, isLast, dispatch }) {
  const { editingId, setEditingId } = React.useContext(AppContext)
  const editId = `item-label-${item.id}`
  const isEditing = editingId === editId
  const [draft, setDraft] = React.useState(item.label)

  React.useEffect(() => {
    if (!isEditing) setDraft(item.label)
  }, [item.label, isEditing])

  const saveLabel = () => {
    const trimmed = draft.trim()
    dispatch({ type: "UPDATE_ITEM_LABEL", payload: { videoId, listKey, itemId: item.id, label: trimmed || item.label } })
    setEditingId(null)
  }

  return (
    <div
      className="group flex items-center gap-2 py-1.5 px-1 -mx-1 rounded-lg"
      style={{ transition: "background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(42,37,32,0.5)"}
      onMouseLeave={e => e.currentTarget.style.background = ""}
    >
      {/* Checkbox */}
      <button
        onClick={() => dispatch({ type: "TOGGLE_ITEM", payload: { videoId, listKey, itemId: item.id } })}
        className="flex-shrink-0 flex items-center justify-center rounded border transition-all"
        style={{
          width: 16, height: 16,
          background: item.checked ? "#5A8F5A" : "transparent",
          borderColor: item.checked ? "#5A8F5A" : "#8B7355",
        }}
      >
        {item.checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#141210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Label */}
      {isEditing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={e => {
            if (e.key === "Enter") saveLabel()
            if (e.key === "Escape") { setDraft(item.label); setEditingId(null) }
          }}
          className="flex-1 text-sm outline-none border-b"
          style={{ background: "transparent", color: "#FFFFFF", borderColor: "#C4956A" }}
        />
      ) : (
        <span
          className="flex-1 text-sm cursor-text select-none"
          style={{
            color: item.checked ? "#8B7355" : "#FFFFFF",
            textDecoration: item.checked ? "line-through" : "none",
          }}
          onClick={() => { setDraft(item.label); setEditingId(editId) }}
        >
          {item.label}
        </span>
      )}

      {/* Hover controls */}
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ flexShrink: 0 }}
      >
        {!isFirst && (
          <button
            onClick={() => dispatch({ type: "REORDER_ITEM", payload: { videoId, listKey, itemId: item.id, direction: "up" } })}
            className="px-1 text-xs transition-colors"
            style={{ color: "#8B7355" }}
            onMouseEnter={e => e.target.style.color = "#C4956A"}
            onMouseLeave={e => e.target.style.color = "#8B7355"}
            title="Move up"
          >↑</button>
        )}
        {!isLast && (
          <button
            onClick={() => dispatch({ type: "REORDER_ITEM", payload: { videoId, listKey, itemId: item.id, direction: "down" } })}
            className="px-1 text-xs transition-colors"
            style={{ color: "#8B7355" }}
            onMouseEnter={e => e.target.style.color = "#C4956A"}
            onMouseLeave={e => e.target.style.color = "#8B7355"}
            title="Move down"
          >↓</button>
        )}
        <button
          onClick={() => dispatch({ type: "DELETE_ITEM", payload: { videoId, listKey, itemId: item.id } })}
          className="px-1 text-xs transition-colors ml-0.5"
          style={{ color: "#8B7355" }}
          onMouseEnter={e => e.target.style.color = "#fca5a5"}
          onMouseLeave={e => e.target.style.color = "#8B7355"}
          title="Delete"
        >×</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// CHECKLIST SECTION
// ─────────────────────────────────────────────

function ChecklistSection({ videoId, listKey, items, dispatch }) {
  const [addingNew, setAddingNew] = React.useState(false)
  const [newLabel, setNewLabel] = React.useState("")
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (addingNew) inputRef.current?.focus()
  }, [addingNew])

  const addItem = () => {
    const trimmed = newLabel.trim()
    if (trimmed) dispatch({ type: "ADD_ITEM", payload: { videoId, listKey, label: trimmed } })
    setNewLabel("")
    setAddingNew(false)
  }

  return (
    <div>
      {items.map((item, idx) => (
        <ChecklistItem
          key={item.id}
          item={item}
          videoId={videoId}
          listKey={listKey}
          isFirst={idx === 0}
          isLast={idx === items.length - 1}
          dispatch={dispatch}
        />
      ))}

      {addingNew ? (
        <div className="flex items-center gap-2 pl-6 py-1.5">
          <input
            ref={inputRef}
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onBlur={addItem}
            onKeyDown={e => {
              if (e.key === "Enter") addItem()
              if (e.key === "Escape") { setNewLabel(""); setAddingNew(false) }
            }}
            placeholder="Item name..."
            className="flex-1 text-sm outline-none border-b"
            style={{ background: "transparent", color: "#FFFFFF", borderColor: "#C4956A", "::placeholder": { color: "#8B7355" } }}
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="pl-6 py-1.5 text-sm transition-colors"
          style={{ color: "#8B7355" }}
          onMouseEnter={e => e.target.style.color = "#C4956A"}
          onMouseLeave={e => e.target.style.color = "#8B7355"}
        >
          + Add item
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// PLATFORM ITEM
// ─────────────────────────────────────────────

function PlatformItem({ platform, videoId, isFirst, isLast, dispatch }) {
  const { editingId, setEditingId } = React.useContext(AppContext)
  const editId = `platform-label-${platform.id}`
  const isEditing = editingId === editId
  const [draft, setDraft] = React.useState(platform.label)

  React.useEffect(() => {
    if (!isEditing) setDraft(platform.label)
  }, [platform.label, isEditing])

  const saveLabel = () => {
    const trimmed = draft.trim()
    dispatch({ type: "UPDATE_PLATFORM_LABEL", payload: { videoId, platformId: platform.id, label: trimmed || platform.label } })
    setEditingId(null)
  }

  return (
    <div
      className="group flex items-center gap-2 py-1.5 px-1 -mx-1 rounded-lg"
      style={{ transition: "background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(42,37,32,0.5)"}
      onMouseLeave={e => e.currentTarget.style.background = ""}
    >
      <button
        onClick={() => dispatch({ type: "TOGGLE_PLATFORM", payload: { videoId, platformId: platform.id } })}
        className="flex-shrink-0 flex items-center justify-center rounded border transition-all"
        style={{
          width: 16, height: 16,
          background: platform.posted ? "#5A8F5A" : "transparent",
          borderColor: platform.posted ? "#5A8F5A" : "#8B7355",
        }}
      >
        {platform.posted && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#141210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {isEditing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={e => {
            if (e.key === "Enter") saveLabel()
            if (e.key === "Escape") { setDraft(platform.label); setEditingId(null) }
          }}
          className="flex-1 text-sm outline-none border-b"
          style={{ background: "transparent", color: "#FFFFFF", borderColor: "#C4956A" }}
        />
      ) : (
        <span
          className="flex-1 text-sm cursor-text select-none"
          style={{
            color: platform.posted ? "#8B7355" : "#FFFFFF",
            textDecoration: platform.posted ? "line-through" : "none",
          }}
          onClick={() => { setDraft(platform.label); setEditingId(editId) }}
        >
          {platform.label}
        </span>
      )}

      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ flexShrink: 0 }}
      >
        {!isFirst && (
          <button
            onClick={() => dispatch({ type: "REORDER_PLATFORM", payload: { videoId, platformId: platform.id, direction: "up" } })}
            className="px-1 text-xs transition-colors"
            style={{ color: "#8B7355" }}
            onMouseEnter={e => e.target.style.color = "#C4956A"}
            onMouseLeave={e => e.target.style.color = "#8B7355"}
            title="Move up"
          >↑</button>
        )}
        {!isLast && (
          <button
            onClick={() => dispatch({ type: "REORDER_PLATFORM", payload: { videoId, platformId: platform.id, direction: "down" } })}
            className="px-1 text-xs transition-colors"
            style={{ color: "#8B7355" }}
            onMouseEnter={e => e.target.style.color = "#C4956A"}
            onMouseLeave={e => e.target.style.color = "#8B7355"}
            title="Move down"
          >↓</button>
        )}
        <button
          onClick={() => dispatch({ type: "DELETE_PLATFORM", payload: { videoId, platformId: platform.id } })}
          className="px-1 text-xs transition-colors ml-0.5"
          style={{ color: "#8B7355" }}
          onMouseEnter={e => e.target.style.color = "#fca5a5"}
          onMouseLeave={e => e.target.style.color = "#8B7355"}
          title="Delete"
        >×</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PLATFORM SECTION
// ─────────────────────────────────────────────

function PlatformSection({ videoId, platforms, dispatch }) {
  const [addingNew, setAddingNew] = React.useState(false)
  const [newLabel, setNewLabel] = React.useState("")
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (addingNew) inputRef.current?.focus()
  }, [addingNew])

  const addPlatform = () => {
    const trimmed = newLabel.trim()
    if (trimmed) dispatch({ type: "ADD_PLATFORM", payload: { videoId, label: trimmed } })
    setNewLabel("")
    setAddingNew(false)
  }

  return (
    <div>
      {platforms.map((platform, idx) => (
        <PlatformItem
          key={platform.id}
          platform={platform}
          videoId={videoId}
          isFirst={idx === 0}
          isLast={idx === platforms.length - 1}
          dispatch={dispatch}
        />
      ))}

      {addingNew ? (
        <div className="flex items-center gap-2 pl-6 py-1.5">
          <input
            ref={inputRef}
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onBlur={addPlatform}
            onKeyDown={e => {
              if (e.key === "Enter") addPlatform()
              if (e.key === "Escape") { setNewLabel(""); setAddingNew(false) }
            }}
            placeholder="Platform name..."
            className="flex-1 text-sm outline-none border-b"
            style={{ background: "transparent", color: "#FFFFFF", borderColor: "#C4956A" }}
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="pl-6 py-1.5 text-sm transition-colors"
          style={{ color: "#8B7355" }}
          onMouseEnter={e => e.target.style.color = "#C4956A"}
          onMouseLeave={e => e.target.style.color = "#8B7355"}
        >
          + Add platform
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// NOTE LIST
// ─────────────────────────────────────────────

function NoteList({ videoId, notes, dispatch }) {
  const [noteText, setNoteText] = React.useState("")
  const [editingNoteId, setEditingNoteId] = React.useState(null)
  const [editingText, setEditingText] = React.useState("")

  const formatTs = iso => {
    const d = new Date(iso)
    return (
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    )
  }

  const addNote = () => {
    const trimmed = noteText.trim()
    if (!trimmed) return
    dispatch({ type: "ADD_NOTE", payload: { videoId, text: trimmed } })
    setNoteText("")
  }

  const startEdit = (note) => {
    setEditingNoteId(note.id)
    setEditingText(note.text)
  }

  const saveEdit = (noteId) => {
    const trimmed = editingText.trim()
    if (trimmed) {
      dispatch({ type: "EDIT_NOTE", payload: { videoId, noteId, text: trimmed } })
    }
    setEditingNoteId(null)
  }

  const cancelEdit = () => {
    setEditingNoteId(null)
  }

  return (
    <div>
      <div className="mb-3">
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote() } }}
          placeholder="Dump thoughts here… (Enter to save, Shift+Enter for newline)"
          rows={3}
          className="w-full text-sm rounded-lg p-3 outline-none resize-none border transition-colors"
          style={{
            background: "#141210",
            color: "#FFFFFF",
            borderColor: "#2A2520",
            fontFamily: "inherit",
          }}
          onFocus={e => e.target.style.borderColor = "#C4956A"}
          onBlur={e => e.target.style.borderColor = "#2A2520"}
        />
        <div className="flex justify-end mt-1">
          <button
            onClick={addNote}
            disabled={!noteText.trim()}
            className="text-sm transition-colors"
            style={{ color: noteText.trim() ? "#C4956A" : "#8B7355", cursor: noteText.trim() ? "pointer" : "default" }}
          >
            Save note
          </button>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="space-y-2" style={{ maxHeight: 260, overflowY: "auto" }}>
          {[...notes].reverse().map(note => (
            <div
              key={note.id}
              className="group flex gap-3 rounded-lg p-3 border"
              style={{ background: "#141210", borderColor: "#2A2520" }}
            >
              <div className="flex-1 min-w-0">
                {editingNoteId === note.id ? (
                  <textarea
                    autoFocus
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(note.id) }
                      if (e.key === "Escape") { e.preventDefault(); cancelEdit() }
                    }}
                    onBlur={() => saveEdit(note.id)}
                    rows={3}
                    className="w-full text-sm rounded p-2 outline-none resize-none border transition-colors"
                    style={{
                      background: "#141210",
                      color: "#FFFFFF",
                      borderColor: "#C4956A",
                      fontFamily: "inherit",
                    }}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "#FFFFFF" }}>{note.text}</p>
                )}
                <p className="text-xs mt-1" style={{ color: "#8B7355", fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatTs(note.timestamp)}
                </p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingNoteId !== note.id && (
                  <button
                    onClick={() => startEdit(note)}
                    className="text-sm"
                    style={{ color: "#8B7355" }}
                    onMouseEnter={e => e.target.style.color = "#C4956A"}
                    onMouseLeave={e => e.target.style.color = "#8B7355"}
                  >✎</button>
                )}
                <button
                  onClick={() => dispatch({ type: "DELETE_NOTE", payload: { videoId, noteId: note.id } })}
                  className="text-sm"
                  style={{ color: "#8B7355" }}
                  onMouseEnter={e => e.target.style.color = "#fca5a5"}
                  onMouseLeave={e => e.target.style.color = "#8B7355"}
                >×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// SECTION (collapsible, renamable header)
// ─────────────────────────────────────────────

function Section({ sectionKey, label, onLabelSave, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen)
  const { editingId, setEditingId } = React.useContext(AppContext)
  const editId = `section-label-${sectionKey}`
  const isEditing = editingId === editId
  const [draft, setDraft] = React.useState(label)

  React.useEffect(() => {
    if (!isEditing) setDraft(label)
  }, [label, isEditing])

  const saveLabel = () => {
    const trimmed = draft.trim()
    onLabelSave(trimmed || label)
    setEditingId(null)
  }

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#2A2520" }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "#1C1916" }}
      >
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={e => {
                if (e.key === "Enter") saveLabel()
                if (e.key === "Escape") { setDraft(label); setEditingId(null) }
              }}
              className="text-sm font-semibold outline-none border-b w-40"
              style={{ background: "transparent", color: "#FFFFFF", borderColor: "#C4956A" }}
            />
          ) : (
            <button
              className="text-sm font-semibold text-left transition-colors"
              style={{ color: "#FFFFFF" }}
              onClick={() => { setDraft(label); setEditingId(editId) }}
              onMouseEnter={e => e.target.style.color = "#C4956A"}
              onMouseLeave={e => e.target.style.color = "#FFFFFF"}
              title="Click to rename"
            >
              {label}
            </button>
          )}
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-sm px-1 transition-all duration-200"
          style={{ color: "#8B7355", transform: open ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-block" }}
        >
          ▾
        </button>
      </div>

      {open && (
        <div className="px-4 py-3" style={{ background: "#141210" }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// STATUS FILTER CHIP (editable label)
// ─────────────────────────────────────────────

function StatusFilterChip({ status, isActive, onFilter, dispatch }) {
  const { editingId, setEditingId } = React.useContext(AppContext)
  const editId = `status-label-${status.id}`
  const isEditing = editingId === editId
  const [draft, setDraft] = React.useState(status.label)

  React.useEffect(() => {
    if (!isEditing) setDraft(status.label)
  }, [status.label, isEditing])

  const saveLabel = () => {
    const trimmed = draft.trim()
    dispatch({ type: "UPDATE_STATUS_LABEL", payload: { statusId: status.id, label: trimmed || status.label } })
    setEditingId(null)
  }

  if (isEditing) {
    return (
      <div
        className="flex items-center px-3 py-1 rounded-full border"
        style={{ borderColor: status.color + "55", background: status.color + "18" }}
      >
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={e => {
            if (e.key === "Enter") saveLabel()
            if (e.key === "Escape") { setDraft(status.label); setEditingId(null) }
          }}
          className="text-xs outline-none w-24"
          style={{ background: "transparent", color: status.color, fontFamily: "'JetBrains Mono', monospace" }}
        />
      </div>
    )
  }

  return (
    <div className="group relative flex items-center gap-0.5">
      <button
        onClick={onFilter}
        className="text-xs px-3 py-1 rounded-full border transition-all"
        style={{
          color: status.color,
          borderColor: isActive ? status.color : status.color + "40",
          background: isActive ? status.color + "20" : "transparent",
          opacity: isActive ? 1 : 0.65,
          fontFamily: "'JetBrains Mono', monospace",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
        onMouseLeave={e => e.currentTarget.style.opacity = isActive ? "1" : "0.65"}
      >
        {status.label}
      </button>
      <button
        onClick={e => { e.stopPropagation(); setDraft(status.label); setEditingId(editId) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
        style={{ color: "#8B7355" }}
        onMouseEnter={e => e.target.style.color = "#C4956A"}
        onMouseLeave={e => e.target.style.color = "#8B7355"}
        title="Rename status"
      >✎</button>
    </div>
  )
}

// ─────────────────────────────────────────────
// SERIES SELECTOR
// ─────────────────────────────────────────────

function SeriesSelector({ video, series, dispatch }) {
  if (!series || series.length === 0) return null
  const current = series.find(s => s.id === video.seriesId)
  return (
    <select
      value={video.seriesId || ""}
      onChange={e => dispatch({ type: "SET_VIDEO_SERIES", payload: { videoId: video.id, seriesId: e.target.value || null } })}
      className="text-xs outline-none rounded px-2 py-0.5 border"
      style={{
        background: "#1C1916",
        color: current ? current.color : "#8B7355",
        borderColor: current ? current.color + "80" : "#2A2520",
        fontFamily: "'JetBrains Mono', monospace",
        cursor: "pointer",
      }}
    >
      <option value="" style={{ color: "#8B7355", background: "#141210" }}>No Series</option>
      {series.map(s => (
        <option key={s.id} value={s.id} style={{ color: "#FFFFFF", background: "#141210" }}>{s.name}</option>
      ))}
    </select>
  )
}

// ─────────────────────────────────────────────
// DETAIL HEADER
// ─────────────────────────────────────────────

function DetailHeader({ video, statuses, series, dispatch, onBack, onDelete }) {
  const { editingId, setEditingId } = React.useContext(AppContext)
  const editId = `video-title-${video.id}`
  const isEditing = editingId === editId
  const [draft, setDraft] = React.useState(video.title)

  React.useEffect(() => {
    if (!isEditing) setDraft(video.title)
  }, [video.title, isEditing])

  const saveTitle = () => {
    const trimmed = draft.trim()
    dispatch({ type: "UPDATE_VIDEO_TITLE", payload: { videoId: video.id, title: trimmed || video.title } })
    setEditingId(null)
  }

  const formatDate = iso =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return (
    <div className="flex items-start gap-3 mb-6">
      <button
        onClick={onBack}
        className="text-sm mt-1.5 flex-shrink-0 transition-colors"
        style={{ color: "#8B7355" }}
        onMouseEnter={e => e.target.style.color = "#E8DDD0"}
        onMouseLeave={e => e.target.style.color = "#8B7355"}
      >
        ← Back
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => {
              if (e.key === "Enter") saveTitle()
              if (e.key === "Escape") { setDraft(video.title); setEditingId(null) }
            }}
            className="w-full text-xl font-semibold outline-none border-b"
            style={{ background: "transparent", color: "#FFFFFF", borderColor: "#C4956A" }}
          />
        ) : (
          <h1
            className="text-xl font-semibold cursor-text transition-colors"
            style={{ color: "#FFFFFF" }}
            onClick={() => { setDraft(video.title); setEditingId(editId) }}
            onMouseEnter={e => e.target.style.color = "#D4A574"}
            onMouseLeave={e => e.target.style.color = "#FFFFFF"}
          >
            {video.title}
          </h1>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <StatusBadge
            statusId={video.statusId}
            statuses={statuses}
            onCycle={() => dispatch({ type: "CYCLE_VIDEO_STATUS", payload: { videoId: video.id } })}
          />
          <SeriesSelector video={video} series={series} dispatch={dispatch} />
          <span className="text-xs" style={{ color: "#8B7355", fontFamily: "'JetBrains Mono', monospace" }}>
            {formatDate(video.createdAt)}
          </span>
        </div>
      </div>

      <button
        onClick={onDelete}
        className="text-xs mt-1.5 flex-shrink-0 transition-colors"
        style={{ color: "#8B7355" }}
        onMouseEnter={e => e.target.style.color = "#fca5a5"}
        onMouseLeave={e => e.target.style.color = "#8B7355"}
      >
        Delete
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// DETAIL VIEW
// ─────────────────────────────────────────────

function DetailView({ video, config, dispatch, onBack }) {
  const [deleteConfirm, setDeleteConfirm] = React.useState(false)
  const progress = calcProgress(video)

  const handleDelete = () => {
    dispatch({ type: "DELETE_VIDEO", payload: { videoId: video.id } })
    onBack()
  }

  const sectionLabel = key => config.sectionLabels[key]
  const saveSection = key => label => dispatch({ type: "UPDATE_SECTION_LABEL", payload: { sectionKey: key, label } })

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
      <DetailHeader
        video={video}
        statuses={config.statuses}
        series={config.series || []}
        dispatch={dispatch}
        onBack={onBack}
        onDelete={() => setDeleteConfirm(true)}
      />

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "#2A2520" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.round(progress * 100)}%`,
              background: progress >= 1 ? "#5A8F5A" : "#C4956A",
              transition: "width 0.4s ease, background 0.4s ease",
            }}
          />
        </div>
        <span className="text-xs w-10 text-right" style={{ color: "#8B7355", fontFamily: "'JetBrains Mono', monospace" }}>
          {Math.round(progress * 100)}%
        </span>
      </div>

      <div className="space-y-3">
        <Section sectionKey="brainDump" label={sectionLabel("brainDump")} onLabelSave={saveSection("brainDump")} defaultOpen={true}>
          <NoteList videoId={video.id} notes={video.notes} dispatch={dispatch} />
        </Section>

        <Section sectionKey="content" label={sectionLabel("content")} onLabelSave={saveSection("content")}>
          <DraftSection videoId={video.id} draftFields={video.draftFields} dispatch={dispatch} />
        </Section>

        <Section sectionKey="production" label={sectionLabel("production")} onLabelSave={saveSection("production")}>
          <ChecklistSection videoId={video.id} listKey="productionItems" items={video.productionItems} dispatch={dispatch} />
        </Section>

        <Section sectionKey="postingPrep" label={sectionLabel("postingPrep")} onLabelSave={saveSection("postingPrep")}>
          <ChecklistSection videoId={video.id} listKey="postingPrepItems" items={video.postingPrepItems} dispatch={dispatch} />
        </Section>

        <Section sectionKey="postedTo" label={sectionLabel("postedTo")} onLabelSave={saveSection("postedTo")}>
          <PlatformSection videoId={video.id} platforms={video.platforms} dispatch={dispatch} />
        </Section>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm}
        message={`Delete "${video.title}"? This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// VIDEO CARD
// ─────────────────────────────────────────────

function VideoCard({ video, statuses, series, onSelect, dispatch }) {
  const progress = calcProgress(video)
  const totalItems =
    video.productionItems.length + video.postingPrepItems.length + video.platforms.length
  const doneItems =
    video.productionItems.filter(i => i.checked).length +
    video.postingPrepItems.filter(i => i.checked).length +
    video.platforms.filter(p => p.posted).length

  return (
    <div
      onClick={onSelect}
      className="rounded-xl p-4 border cursor-pointer transition-all"
      style={{ background: "#1C1916", borderColor: "#2A2520" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(196,149,106,0.4)" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#2A2520" }}
    >
      <div className="flex items-start gap-4">
        {/* Progress ring */}
        <div className="flex-shrink-0 relative" style={{ width: 48, height: 48 }}>
          <ProgressRing progress={progress} size={48} strokeWidth={4} />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ fontSize: 10, color: "#8B7355", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {Math.round(progress * 100)}%
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {video.seriesId && series && (() => {
              const s = series.find(s => s.id === video.seriesId)
              return s ? (
                <div
                  className="flex-shrink-0 rounded-full"
                  style={{ width: 8, height: 8, background: s.color }}
                  title={s.name}
                />
              ) : null
            })()}
            <h3
              className="font-semibold truncate transition-colors"
              style={{ color: "#FFFFFF" }}
            >
              {video.title}
            </h3>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <StatusBadge
              statusId={video.statusId}
              statuses={statuses}
              onCycle={e => {
                e.stopPropagation()
                dispatch({ type: "CYCLE_VIDEO_STATUS", payload: { videoId: video.id } })
              }}
            />
            <span className="text-xs" style={{ color: "#8B7355", fontFamily: "'JetBrains Mono', monospace" }}>
              {doneItems}/{totalItems} items
            </span>
          </div>
        </div>

        <span className="flex-shrink-0 mt-1 text-sm" style={{ color: "#8B7355" }}>→</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// LIST VIEW HEADER
// ─────────────────────────────────────────────

function ListViewHeader({ videos, statuses, filterStatusId, setFilterStatusId, dispatch, onAddVideo, onAddSeries, onEditTemplate }) {
  const inProgress = videos.filter(v => { const p = calcProgress(v); return p > 0 && p < 1 }).length
  const complete   = videos.filter(v => calcProgress(v) >= 1).length
  const total      = videos.length

  return (
    <div className="mb-6">
      {/* Title row + primary action */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold" style={{ color: "#E8DDD0" }}>Videos</h1>
        <button
          onClick={onAddVideo}
          className="px-4 py-2 rounded-xl border text-sm transition-all"
          style={{ borderStyle: "dashed", borderColor: "#C4956A60", color: "#C4956A" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(196,149,106,0.1)"; e.currentTarget.style.borderColor = "#C4956A" }}
          onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = "#C4956A60" }}
        >
          + New Video
        </button>
      </div>

      {/* Secondary actions */}
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={onAddSeries}
          className="text-xs transition-colors"
          style={{ color: "#8B7355" }}
          onMouseEnter={e => e.target.style.color = "#C4956A"}
          onMouseLeave={e => e.target.style.color = "#8B7355"}
        >
          + Series
        </button>
        <button
          onClick={onEditTemplate}
          className="text-xs transition-colors"
          style={{ color: "#8B7355" }}
          onMouseEnter={e => e.target.style.color = "#C4956A"}
          onMouseLeave={e => e.target.style.color = "#8B7355"}
        >
          Edit Template
        </button>
      </div>

      {total > 0 && (
        <>
          {/* Quick stats */}
          <div className="flex gap-6 mb-5">
            {[
              { label: "In Progress", value: inProgress, color: "#C4956A" },
              { label: "Complete",    value: complete,    color: "#7CAE7A" },
              { label: "Total",       value: total,       color: "#8B7355" },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-semibold" style={{ color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>
                  {stat.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#8B7355" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setFilterStatusId(null)}
              className="text-xs px-3 py-1 rounded-full border transition-all"
              style={{
                color: filterStatusId === null ? "#C4956A" : "#8B7355",
                borderColor: filterStatusId === null ? "#C4956A" : "#2A2520",
                background: filterStatusId === null ? "rgba(196,149,106,0.1)" : "transparent",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              All
            </button>
            {statuses.map(status => (
              <StatusFilterChip
                key={status.id}
                status={status}
                isActive={filterStatusId === status.id}
                onFilter={() => setFilterStatusId(filterStatusId === status.id ? null : status.id)}
                dispatch={dispatch}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// DRAFT SECTION (labeled text areas per video)
// ─────────────────────────────────────────────

function DraftFieldItem({ field, videoId, isFirst, isLast, dispatch }) {
  const { editingId, setEditingId } = React.useContext(AppContext)
  const editId = `draft-label-${field.id}`
  const isEditingLabel = editingId === editId
  const [labelDraft, setLabelDraft] = React.useState(field.label)

  React.useEffect(() => {
    if (!isEditingLabel) setLabelDraft(field.label)
  }, [field.label, isEditingLabel])

  const saveLabel = () => {
    const trimmed = labelDraft.trim()
    dispatch({ type: "UPDATE_DRAFT_LABEL", payload: { videoId, fieldId: field.id, label: trimmed || field.label } })
    setEditingId(null)
  }

  return (
    <div className="mb-4">
      {/* Label row */}
      <div
        className="group flex items-center gap-2 mb-1.5"
      >
        {isEditingLabel ? (
          <input
            autoFocus
            value={labelDraft}
            onChange={e => setLabelDraft(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={e => {
              if (e.key === "Enter") saveLabel()
              if (e.key === "Escape") { setLabelDraft(field.label); setEditingId(null) }
            }}
            className="text-xs font-semibold outline-none border-b"
            style={{ background: "transparent", color: "#C4956A", borderColor: "#C4956A", fontFamily: "'JetBrains Mono', monospace" }}
          />
        ) : (
          <span
            className="text-xs font-semibold cursor-text transition-colors"
            style={{ color: "#8B7355", fontFamily: "'JetBrains Mono', monospace" }}
            onClick={() => { setLabelDraft(field.label); setEditingId(editId) }}
            onMouseEnter={e => e.target.style.color = "#C4956A"}
            onMouseLeave={e => e.target.style.color = "#8B7355"}
            title="Click to rename"
          >
            {field.label.toUpperCase()}
          </span>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
          {!isFirst && (
            <button
              onClick={() => dispatch({ type: "REORDER_DRAFT_FIELD", payload: { videoId, fieldId: field.id, direction: "up" } })}
              className="px-1 text-xs transition-colors" style={{ color: "#8B7355" }}
              onMouseEnter={e => e.target.style.color = "#C4956A"}
              onMouseLeave={e => e.target.style.color = "#8B7355"}
            >↑</button>
          )}
          {!isLast && (
            <button
              onClick={() => dispatch({ type: "REORDER_DRAFT_FIELD", payload: { videoId, fieldId: field.id, direction: "down" } })}
              className="px-1 text-xs transition-colors" style={{ color: "#8B7355" }}
              onMouseEnter={e => e.target.style.color = "#C4956A"}
              onMouseLeave={e => e.target.style.color = "#8B7355"}
            >↓</button>
          )}
          <button
            onClick={() => dispatch({ type: "DELETE_DRAFT_FIELD", payload: { videoId, fieldId: field.id } })}
            className="px-1 text-xs transition-colors ml-0.5" style={{ color: "#8B7355" }}
            onMouseEnter={e => e.target.style.color = "#fca5a5"}
            onMouseLeave={e => e.target.style.color = "#8B7355"}
          >×</button>
        </div>
      </div>

      {/* Text area */}
      <textarea
        value={field.content}
        onChange={e => dispatch({ type: "UPDATE_DRAFT_CONTENT", payload: { videoId, fieldId: field.id, content: e.target.value } })}
        placeholder={`Draft your ${field.label.toLowerCase()} here…`}
        rows={field.label.toLowerCase().includes("description") ? 5 : 2}
        className="w-full text-sm rounded-lg p-3 outline-none resize-y border transition-colors"
        style={{
          background: "#1C1916",
          color: "#FFFFFF",
          borderColor: "#2A2520",
          fontFamily: "inherit",
          minHeight: 44,
        }}
        onFocus={e => e.target.style.borderColor = "#C4956A"}
        onBlur={e => e.target.style.borderColor = "#2A2520"}
      />
    </div>
  )
}

function DraftSection({ videoId, draftFields, dispatch }) {
  const [addingNew, setAddingNew] = React.useState(false)
  const [newLabel, setNewLabel] = React.useState("")
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (addingNew) inputRef.current?.focus()
  }, [addingNew])

  const addField = () => {
    const trimmed = newLabel.trim()
    if (trimmed) dispatch({ type: "ADD_DRAFT_FIELD", payload: { videoId, label: trimmed } })
    setNewLabel("")
    setAddingNew(false)
  }

  const fields = draftFields || []

  return (
    <div>
      {fields.map((field, idx) => (
        <DraftFieldItem
          key={field.id}
          field={field}
          videoId={videoId}
          isFirst={idx === 0}
          isLast={idx === fields.length - 1}
          dispatch={dispatch}
        />
      ))}

      {addingNew ? (
        <div className="flex items-center gap-2 py-1">
          <input
            ref={inputRef}
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onBlur={addField}
            onKeyDown={e => {
              if (e.key === "Enter") addField()
              if (e.key === "Escape") { setNewLabel(""); setAddingNew(false) }
            }}
            placeholder="Field name (e.g. Hook Script)…"
            className="flex-1 text-sm outline-none border-b"
            style={{ background: "transparent", color: "#FFFFFF", borderColor: "#C4956A" }}
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="py-1 text-sm transition-colors" style={{ color: "#8B7355" }}
          onMouseEnter={e => e.target.style.color = "#C4956A"}
          onMouseLeave={e => e.target.style.color = "#8B7355"}
        >
          + Add field
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TEMPLATE ITEM (label only, no checkbox)
// ─────────────────────────────────────────────

function TemplateItem({ item, listKey, isFirst, isLast, dispatch }) {
  const { editingId, setEditingId } = React.useContext(AppContext)
  const editId = `template-item-${item.id}`
  const isEditing = editingId === editId
  const [draft, setDraft] = React.useState(item.label)

  React.useEffect(() => {
    if (!isEditing) setDraft(item.label)
  }, [item.label, isEditing])

  const saveLabel = () => {
    const trimmed = draft.trim()
    dispatch({ type: "UPDATE_DEFAULT_ITEM_LABEL", payload: { listKey, itemId: item.id, label: trimmed || item.label } })
    setEditingId(null)
  }

  return (
    <div
      className="group flex items-center gap-2 py-1.5 px-1 -mx-1 rounded-lg"
      style={{ transition: "background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(42,37,32,0.5)"}
      onMouseLeave={e => e.currentTarget.style.background = ""}
    >
      <span style={{ color: "#8B7355", fontSize: 12, width: 8, flexShrink: 0 }}>—</span>

      {isEditing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={e => {
            if (e.key === "Enter") saveLabel()
            if (e.key === "Escape") { setDraft(item.label); setEditingId(null) }
          }}
          className="flex-1 text-sm outline-none border-b"
          style={{ background: "transparent", color: "#FFFFFF", borderColor: "#C4956A" }}
        />
      ) : (
        <span
          className="flex-1 text-sm cursor-text select-none"
          style={{ color: "#FFFFFF" }}
          onClick={() => { setDraft(item.label); setEditingId(editId) }}
        >
          {item.label}
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ flexShrink: 0 }}>
        {!isFirst && (
          <button
            onClick={() => dispatch({ type: "REORDER_DEFAULT_ITEM", payload: { listKey, itemId: item.id, direction: "up" } })}
            className="px-1 text-xs transition-colors" style={{ color: "#8B7355" }}
            onMouseEnter={e => e.target.style.color = "#C4956A"}
            onMouseLeave={e => e.target.style.color = "#8B7355"}
          >↑</button>
        )}
        {!isLast && (
          <button
            onClick={() => dispatch({ type: "REORDER_DEFAULT_ITEM", payload: { listKey, itemId: item.id, direction: "down" } })}
            className="px-1 text-xs transition-colors" style={{ color: "#8B7355" }}
            onMouseEnter={e => e.target.style.color = "#C4956A"}
            onMouseLeave={e => e.target.style.color = "#8B7355"}
          >↓</button>
        )}
        <button
          onClick={() => dispatch({ type: "DELETE_DEFAULT_ITEM", payload: { listKey, itemId: item.id } })}
          className="px-1 text-xs transition-colors ml-0.5" style={{ color: "#8B7355" }}
          onMouseEnter={e => e.target.style.color = "#fca5a5"}
          onMouseLeave={e => e.target.style.color = "#8B7355"}
        >×</button>
      </div>
    </div>
  )
}

function TemplateList({ listKey, items, dispatch, addLabel }) {
  const [addingNew, setAddingNew] = React.useState(false)
  const [newLabel, setNewLabel] = React.useState("")
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (addingNew) inputRef.current?.focus()
  }, [addingNew])

  const addItem = () => {
    const trimmed = newLabel.trim()
    if (trimmed) dispatch({ type: "ADD_DEFAULT_ITEM", payload: { listKey, label: trimmed } })
    setNewLabel("")
    setAddingNew(false)
  }

  return (
    <div>
      {items.map((item, idx) => (
        <TemplateItem
          key={item.id}
          item={item}
          listKey={listKey}
          isFirst={idx === 0}
          isLast={idx === items.length - 1}
          dispatch={dispatch}
        />
      ))}
      {addingNew ? (
        <div className="flex items-center gap-2 pl-5 py-1.5">
          <input
            ref={inputRef}
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onBlur={addItem}
            onKeyDown={e => {
              if (e.key === "Enter") addItem()
              if (e.key === "Escape") { setNewLabel(""); setAddingNew(false) }
            }}
            placeholder={`New ${addLabel}...`}
            className="flex-1 text-sm outline-none border-b"
            style={{ background: "transparent", color: "#FFFFFF", borderColor: "#C4956A" }}
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="pl-5 py-1.5 text-sm transition-colors" style={{ color: "#8B7355" }}
          onMouseEnter={e => e.target.style.color = "#C4956A"}
          onMouseLeave={e => e.target.style.color = "#8B7355"}
        >
          + Add {addLabel}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TEMPLATE VIEW
// ─────────────────────────────────────────────

function TemplateView({ config, dispatch, onBack }) {
  const sections = [
    { key: "defaultProductionItems",  label: config.sectionLabels.production,  addLabel: "item" },
    { key: "defaultPostingPrepItems", label: config.sectionLabels.postingPrep, addLabel: "item" },
    { key: "defaultPlatforms",        label: config.sectionLabels.postedTo,    addLabel: "platform" },
    { key: "defaultDraftFields",      label: config.sectionLabels.content,     addLabel: "field" },
  ]

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          className="text-sm transition-colors" style={{ color: "#8B7355" }}
          onMouseEnter={e => e.target.style.color = "#E8DDD0"}
          onMouseLeave={e => e.target.style.color = "#8B7355"}
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold" style={{ color: "#E8DDD0" }}>Default Template</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: "#8B7355" }}>
        Every new video you create starts with these items. Change them here and all future videos will reflect it.
      </p>

      <div className="space-y-3">
        {sections.map(section => (
          <div key={section.key} className="rounded-xl border p-4" style={{ background: "#1C1916", borderColor: "#2A2520" }}>
            <p className="text-sm font-semibold mb-3" style={{ color: "#FFFFFF" }}>{section.label}</p>
            <TemplateList
              listKey={section.key}
              items={config[section.key]}
              dispatch={dispatch}
              addLabel={section.addLabel}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SERIES GROUP HEADER
// ─────────────────────────────────────────────

function SeriesGroupHeader({ series, videoCount, dispatch }) {
  const { editingId, setEditingId } = React.useContext(AppContext)
  const editId = `series-name-${series.id}`
  const isEditing = editingId === editId
  const [draft, setDraft] = React.useState(series.name)

  React.useEffect(() => {
    if (!isEditing) setDraft(series.name)
  }, [series.name, isEditing])

  const saveName = () => {
    const trimmed = draft.trim()
    dispatch({ type: "UPDATE_SERIES_NAME", payload: { seriesId: series.id, name: trimmed || series.name } })
    setEditingId(null)
  }

  return (
    <div
      className="group flex items-center gap-2 mb-2 mt-5 first:mt-0"
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: series.color }} />
      {isEditing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={saveName}
          onKeyDown={e => {
            if (e.key === "Enter") saveName()
            if (e.key === "Escape") { setDraft(series.name); setEditingId(null) }
          }}
          className="text-sm font-semibold outline-none border-b"
          style={{ background: "transparent", color: "#FFFFFF", borderColor: series.color, minWidth: 120 }}
        />
      ) : (
        <span
          className="text-sm font-semibold cursor-text transition-colors"
          style={{ color: "#FFFFFF" }}
          onClick={() => { setDraft(series.name); setEditingId(editId) }}
          onMouseEnter={e => e.target.style.color = series.color}
          onMouseLeave={e => e.target.style.color = "#FFFFFF"}
          title="Click to rename series"
        >
          {series.name}
        </span>
      )}
      <span className="text-xs" style={{ color: "#8B7355", fontFamily: "'JetBrains Mono', monospace" }}>
        {videoCount} {videoCount === 1 ? "video" : "videos"}
      </span>
      <button
        onClick={() => dispatch({ type: "DELETE_SERIES", payload: { seriesId: series.id } })}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs ml-auto"
        style={{ color: "#8B7355" }}
        onMouseEnter={e => e.target.style.color = "#fca5a5"}
        onMouseLeave={e => e.target.style.color = "#8B7355"}
        title="Delete series (videos become unassigned)"
      >× Remove</button>
    </div>
  )
}

// ─────────────────────────────────────────────
// LIST VIEW
// ─────────────────────────────────────────────

function ListView({ state, dispatch, onSelectVideo, onEditTemplate, filterStatusId, setFilterStatusId }) {
  const { setEditingId } = React.useContext(AppContext)

  const handleAddVideo = () => {
    const video = createVideo(state.config)
    dispatch({ type: "ADD_VIDEO", payload: { video } })
    setEditingId(`video-title-${video.id}`)
    onSelectVideo(video.id)
  }

  const handleAddSeries = () => {
    const id = uid("sr")
    dispatch({ type: "ADD_SERIES", payload: { id, name: "New Series" } })
    setEditingId(`series-name-${id}`)
  }

  const filtered = filterStatusId
    ? state.videos.filter(v => v.statusId === filterStatusId)
    : state.videos

  const series = state.config.series || []
  const hasSeries = series.length > 0

  // Build groups: each series + unassigned
  const seriesGroups = series.map(s => ({
    series: s,
    videos: filtered.filter(v => v.seriesId === s.id),
  }))
  const unassigned = filtered.filter(v => !v.seriesId || !series.find(s => s.id === v.seriesId))

  const totalFiltered = filtered.length

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
      <ListViewHeader
        videos={state.videos}
        statuses={state.config.statuses}
        filterStatusId={filterStatusId}
        setFilterStatusId={setFilterStatusId}
        dispatch={dispatch}
        onAddVideo={handleAddVideo}
        onAddSeries={handleAddSeries}
        onEditTemplate={onEditTemplate}
      />

      <div className="mb-4">
        {/* Series groups */}
        {hasSeries && seriesGroups.map(({ series: s, videos }) => (
          <div key={s.id}>
            <SeriesGroupHeader series={s} videoCount={videos.length} dispatch={dispatch} />
            <div
              className="pl-3 space-y-2 mb-3"
              style={{ borderLeft: `2px solid ${s.color}40`, marginLeft: 4 }}
            >
              {videos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  statuses={state.config.statuses}
                  series={series}
                  onSelect={() => onSelectVideo(video.id)}
                  dispatch={dispatch}
                />
              ))}
              {videos.length === 0 && (
                <p className="text-xs py-2 pl-1" style={{ color: "#8B7355" }}>
                  No videos assigned to this series yet.
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Unassigned videos */}
        {unassigned.length > 0 && (
          <div>
            {hasSeries && (
              <div className="flex items-center gap-2 mb-2 mt-5">
                <span className="text-sm font-semibold" style={{ color: "#8B7355" }}>Other</span>
                <span className="text-xs" style={{ color: "#8B7355", fontFamily: "'JetBrains Mono', monospace" }}>
                  {unassigned.length} {unassigned.length === 1 ? "video" : "videos"}
                </span>
              </div>
            )}
            <div className="space-y-2">
              {unassigned.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  statuses={state.config.statuses}
                  series={series}
                  onSelect={() => onSelectVideo(video.id)}
                  dispatch={dispatch}
                />
              ))}
            </div>
          </div>
        )}

        {totalFiltered === 0 && state.videos.length > 0 && (
          <p className="text-center py-8 text-sm" style={{ color: "#8B7355" }}>
            No videos with this status.
          </p>
        )}

        {state.videos.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎬</div>
            <p className="mb-2" style={{ color: "#8B7355" }}>No videos yet.</p>
            <p className="text-sm" style={{ color: "#8B7355" }}>Create your first one below to start tracking.</p>
          </div>
        )}
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────
// APP (root)
// ─────────────────────────────────────────────

export default function App() {
  const [state, dispatch]           = React.useReducer(reducer, DEFAULT_STATE)
  const [loaded, setLoaded]         = React.useState(false)
  const [selectedVideoId, setSelectedVideoId] = React.useState(null)
  const [showTemplate, setShowTemplate]       = React.useState(false)
  const [filterStatusId, setFilterStatusId]   = React.useState(null)
  const [editingId, setEditingId]             = React.useState(null)

  // Load state from file on first mount
  React.useEffect(() => {
    fetch('/api/state')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.config && Array.isArray(data.videos)) {
          data.config.defaultProductionItems  = migrateDefaultList(data.config.defaultProductionItems)
          data.config.defaultPostingPrepItems = migrateDefaultList(data.config.defaultPostingPrepItems)
          data.config.defaultPlatforms        = migrateDefaultList(data.config.defaultPlatforms)
          data.config.defaultDraftFields      = migrateDefaultList(data.config.defaultDraftFields || DEFAULT_STATE.config.defaultDraftFields)
          if (!data.config.sectionLabels.content) data.config.sectionLabels.content = "Content"
          if (!data.config.series) data.config.series = []
          data.videos = data.videos.map(v => ('seriesId' in v ? v : { ...v, seriesId: null }))
          dispatch({ type: 'LOAD_STATE', payload: data })
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // Save to file on every state change (after initial load)
  React.useEffect(() => {
    if (!loaded) return
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch(() => {})
  }, [state, loaded])

  // If selected video was deleted, return to list
  const selectedVideo = selectedVideoId ? state.videos.find(v => v.id === selectedVideoId) : null
  React.useEffect(() => {
    if (selectedVideoId && !selectedVideo) setSelectedVideoId(null)
  }, [selectedVideoId, selectedVideo])

  return (
    <AppContext.Provider value={{ state, dispatch, editingId, setEditingId }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        * { font-family: 'DM Sans', system-ui, sans-serif; }
        .group:hover .group-hover\\:opacity-100 { opacity: 1 !important; }
        .opacity-0 { opacity: 0; }
        ::placeholder { color: #8B7355; opacity: 1; }
        textarea::placeholder { color: #8B7355; opacity: 1; }
        * { scrollbar-width: thin; scrollbar-color: #2A2520 transparent; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: #2A2520; border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#141210", color: "#E8DDD0" }}>
        {!loaded ? (
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#8B7355", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>Loading…</span>
          </div>
        ) : selectedVideo ? (
          <DetailView
            video={selectedVideo}
            config={state.config}
            dispatch={dispatch}
            onBack={() => setSelectedVideoId(null)}
          />
        ) : showTemplate ? (
          <TemplateView
            config={state.config}
            dispatch={dispatch}
            onBack={() => setShowTemplate(false)}
          />
        ) : (
          <ListView
            state={state}
            dispatch={dispatch}
            onSelectVideo={setSelectedVideoId}
            onEditTemplate={() => setShowTemplate(true)}
            filterStatusId={filterStatusId}
            setFilterStatusId={setFilterStatusId}
          />
        )}
      </div>
    </AppContext.Provider>
  )
}

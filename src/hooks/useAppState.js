// ─────────────────────────────────────────────
// State Layer — useAppState hook
// Reducer, context, utilities, persistence
// ─────────────────────────────────────────────

import React from 'react'

// ── Series palette ──────────────────────────────
export const SERIES_PALETTE = ["#7B9EC4", "#B07CC6", "#76AE8C", "#C47B7B", "#A8B87B", "#9B7BC4"]

// ── Utilities ────────────────────────────────────
export function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function calcProgress(video) {
  const total =
    (video.productionItems?.length || 0) +
    (video.postingPrepItems?.length || 0) +
    (video.platforms?.length || 0)
  if (total === 0) return 0
  const done =
    (video.productionItems?.filter(i => i.checked).length || 0) +
    (video.postingPrepItems?.filter(i => i.checked).length || 0) +
    (video.platforms?.filter(p => p.posted).length || 0)
  return done / total
}

export function getNextAction(video) {
  const uncheckedProd = (video.productionItems || []).find(i => !i.checked)
  if (uncheckedProd) return { label: uncheckedProd.label, section: 'Production', id: uncheckedProd.id, listKey: 'productionItems' }
  const uncheckedPost = (video.postingPrepItems || []).find(i => !i.checked)
  if (uncheckedPost) return { label: uncheckedPost.label, section: 'Posting Prep', id: uncheckedPost.id, listKey: 'postingPrepItems' }
  const unposted = (video.platforms || []).find(p => !p.posted)
  if (unposted) return { label: unposted.label, section: 'Distribution', id: unposted.id, isPlatform: true }
  return null
}

export function isSectionComplete(video, section) {
  if (section === 'productionItems') return (video.productionItems || []).every(i => i.checked)
  if (section === 'postingPrepItems') return (video.postingPrepItems || []).every(i => i.checked)
  if (section === 'platforms') return (video.platforms || []).every(p => p.posted)
  return false
}

export function isEpisodeComplete(video) {
  return (
    (video.productionItems || []).every(i => i.checked) &&
    (video.postingPrepItems || []).every(i => i.checked) &&
    (video.platforms || []).every(p => p.posted)
  )
}

function createVideo(config, overrides = {}) {
  const productionItems = overrides.productionItems ||
    (config.defaultProductionItems || []).map(item => ({ id: uid("pi"), label: item.label, checked: false }))
  const postingPrepItems = overrides.postingPrepItems ||
    (config.defaultPostingPrepItems || []).map(item => ({ id: uid("pp"), label: item.label, checked: false }))
  const platforms = overrides.platforms ||
    (config.defaultPlatforms || []).map(item => ({ id: uid("pl"), label: item.label, posted: false }))
  const draftFields = overrides.draftFields ||
    (config.defaultDraftFields || []).map(item => ({ id: uid("df"), label: item.label, content: "" }))

  return {
    id: uid("v"),
    title: overrides.title || "Untitled Episode",
    statusId: config.statuses[0].id,
    createdAt: new Date().toISOString(),
    lastTouched: new Date().toISOString(),
    notes: [],
    productionItems,
    postingPrepItems,
    platforms,
    draftFields,
    seriesId: overrides.seriesId || null,
  }
}

// ── Default state ─────────────────────────────────
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
    ],
    defaultDraftFields: [
      { id: "ddf_1", label: "Title" },
      { id: "ddf_2", label: "Description" },
    ],
    series: [],
    savedNotes: [],
    snippets: [],
    workflowTemplates: [],
    xp: { total: 0, history: [] },
  },
  videos: [],
}

// ── Migration ─────────────────────────────────────
function migrateDefaultList(list) {
  if (!Array.isArray(list)) return []
  return list.map((item, i) =>
    typeof item === "string" ? { id: `migrated_${i}_${Date.now()}`, label: item } : item
  )
}

function migrateState(loaded) {
  const config = { ...DEFAULT_STATE.config, ...loaded.config }

  // Migrate lists
  config.defaultProductionItems = migrateDefaultList(config.defaultProductionItems)
  config.defaultPostingPrepItems = migrateDefaultList(config.defaultPostingPrepItems)
  config.defaultPlatforms = migrateDefaultList(config.defaultPlatforms)
  config.defaultDraftFields = migrateDefaultList(config.defaultDraftFields || [])
  config.series = config.series || []
  config.savedNotes = config.savedNotes || []

  // New fields
  if (!config.snippets) {
    config.snippets = (config.savedNotes || []).map(n => ({
      id: n.id,
      title: n.title || 'Untitled',
      body: n.body || '',
      category: 'General',
      tags: [],
      usageCount: 0,
      lastUsed: null,
      createdAt: n.createdAt || Date.now(),
    }))
  }
  if (!config.workflowTemplates) config.workflowTemplates = []
  if (!config.xp) config.xp = { total: 0, history: [] }

  // Migrate videos — add lastTouched if missing
  const videos = (loaded.videos || []).map(v => ({
    ...v,
    lastTouched: v.lastTouched || v.createdAt || new Date().toISOString(),
    draftFields: v.draftFields || [],
    notes: v.notes || [],
  }))

  return { config, videos }
}

// ── Reducer ───────────────────────────────────────
function reducer(state, action) {
  const { type, payload } = action

  switch (type) {

    // ── Video CRUD ──────────────────────────────
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
          v.id === payload.videoId
            ? { ...v, title: payload.title, lastTouched: new Date().toISOString() }
            : v
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
          return { ...v, statusId: statuses[(idx + 1) % statuses.length].id, lastTouched: new Date().toISOString() }
        }),
      }
    }
    case "TOUCH_VIDEO": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId ? { ...v, lastTouched: new Date().toISOString() } : v
        ),
      }
    }

    // ── Notes ───────────────────────────────────
    case "ADD_NOTE": {
      const note = { id: uid("n"), text: payload.text, timestamp: new Date().toISOString() }
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? { ...v, notes: [...v.notes, note], lastTouched: new Date().toISOString() }
            : v
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

    // ── Checklist items ──────────────────────────
    case "ADD_ITEM": {
      const { videoId, listKey, label } = payload
      const newItem = { id: uid("item"), label, checked: false }
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === videoId ? { ...v, [listKey]: [...v[listKey], newItem], lastTouched: new Date().toISOString() } : v
        ),
      }
    }
    case "TOGGLE_ITEM": {
      const { videoId, listKey, itemId } = payload
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === videoId
            ? {
                ...v,
                lastTouched: new Date().toISOString(),
                [listKey]: v[listKey].map(i => i.id === itemId ? { ...i, checked: !i.checked } : i),
              }
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

    // ── Platforms ────────────────────────────────
    case "ADD_PLATFORM": {
      const newPlatform = { id: uid("pl"), label: payload.label, posted: false }
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? { ...v, platforms: [...v.platforms, newPlatform], lastTouched: new Date().toISOString() }
            : v
        ),
      }
    }
    case "TOGGLE_PLATFORM": {
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === payload.videoId
            ? {
                ...v,
                lastTouched: new Date().toISOString(),
                platforms: v.platforms.map(p => p.id === payload.platformId ? { ...p, posted: !p.posted } : p),
              }
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

    // ── Default template items ───────────────────
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

    // ── Draft fields ─────────────────────────────
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

    // ── Default draft fields ─────────────────────
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

    // ── Series ───────────────────────────────────
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

    // ── Saved Notes (legacy) ─────────────────────
    case "ADD_SAVED_NOTE": {
      const sn = { id: uid("sn"), title: payload.title, body: payload.body, createdAt: Date.now() }
      return { ...state, config: { ...state.config, savedNotes: [sn, ...(state.config.savedNotes || [])] } }
    }
    case "EDIT_SAVED_NOTE": {
      return {
        ...state,
        config: {
          ...state.config,
          savedNotes: (state.config.savedNotes || []).map(n =>
            n.id === payload.id ? { ...n, title: payload.title, body: payload.body } : n
          ),
        },
      }
    }
    case "DELETE_SAVED_NOTE": {
      return {
        ...state,
        config: { ...state.config, savedNotes: (state.config.savedNotes || []).filter(n => n.id !== payload.id) },
      }
    }

    // ── Snippets ─────────────────────────────────
    case "ADD_SNIPPET": {
      const snippet = {
        id: uid("sn"),
        title: payload.title,
        body: payload.body,
        category: payload.category || 'General',
        tags: payload.tags || [],
        usageCount: 0,
        lastUsed: null,
        createdAt: Date.now(),
      }
      return { ...state, config: { ...state.config, snippets: [snippet, ...(state.config.snippets || [])] } }
    }
    case "EDIT_SNIPPET": {
      return {
        ...state,
        config: {
          ...state.config,
          snippets: (state.config.snippets || []).map(s =>
            s.id === payload.id
              ? { ...s, title: payload.title, body: payload.body, category: payload.category || s.category, tags: payload.tags || s.tags }
              : s
          ),
        },
      }
    }
    case "DELETE_SNIPPET": {
      return {
        ...state,
        config: { ...state.config, snippets: (state.config.snippets || []).filter(s => s.id !== payload.id) },
      }
    }
    case "USE_SNIPPET": {
      return {
        ...state,
        config: {
          ...state.config,
          snippets: (state.config.snippets || []).map(s =>
            s.id === payload.id ? { ...s, usageCount: (s.usageCount || 0) + 1, lastUsed: Date.now() } : s
          ),
        },
      }
    }

    // ── Workflow Templates ────────────────────────
    case "ADD_WORKFLOW_TEMPLATE": {
      const tmpl = {
        id: uid("wt"),
        name: payload.name,
        productionItems: payload.productionItems || [],
        postingPrepItems: payload.postingPrepItems || [],
        platforms: payload.platforms || [],
        draftFields: payload.draftFields || [],
        createdAt: Date.now(),
      }
      return { ...state, config: { ...state.config, workflowTemplates: [...(state.config.workflowTemplates || []), tmpl] } }
    }
    case "EDIT_WORKFLOW_TEMPLATE": {
      return {
        ...state,
        config: {
          ...state.config,
          workflowTemplates: (state.config.workflowTemplates || []).map(t =>
            t.id === payload.id ? { ...t, ...payload.updates } : t
          ),
        },
      }
    }
    case "DELETE_WORKFLOW_TEMPLATE": {
      return {
        ...state,
        config: { ...state.config, workflowTemplates: (state.config.workflowTemplates || []).filter(t => t.id !== payload.id) },
      }
    }

    // ── XP ───────────────────────────────────────
    case "GAIN_XP": {
      const entry = { action: payload.action, points: payload.points, timestamp: Date.now(), episodeId: payload.episodeId || null }
      const xp = state.config.xp || { total: 0, history: [] }
      return {
        ...state,
        config: {
          ...state.config,
          xp: { total: xp.total + payload.points, history: [entry, ...xp.history.slice(0, 99)] },
        },
      }
    }

    // ── Config ───────────────────────────────────
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

    // ── Load ─────────────────────────────────────
    case "LOAD_STATE": {
      return migrateState(payload)
    }

    default:
      return state
  }
}

// ── Context ───────────────────────────────────────
export const AppContext = React.createContext(null)

// ── Main hook ─────────────────────────────────────
export function useAppState() {
  const [state, dispatch] = React.useReducer(reducer, DEFAULT_STATE)
  const [loaded, setLoaded] = React.useState(false)

  // Load from server
  React.useEffect(() => {
    fetch('/api/state')
      .then(r => r.json())
      .then(data => {
        if (data) dispatch({ type: 'LOAD_STATE', payload: data })
      })
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [])

  // Auto-save to server
  const saveRef = React.useRef(null)
  React.useEffect(() => {
    if (!loaded) return
    clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      }).catch(console.error)
    }, 600)
  }, [state, loaded])

  return { state, dispatch, loaded }
}

// ── createVideo export ─────────────────────────────
export { createVideo }

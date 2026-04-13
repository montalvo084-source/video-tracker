import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppContext, useAppState } from './hooks/useAppState'

import BottomNav from './components/BottomNav'
import SpotlightView from './components/SpotlightView'
import EpisodeDetail from './components/EpisodeDetail'
import TemplateDrawer from './components/TemplateDrawer'
import ArchiveView from './components/ArchiveView'
import NewEpisodeModal from './components/NewEpisodeModal'

import './styles/global.css'

export default function App() {
  const { state, dispatch, loaded } = useAppState()

  // ── Navigation state ──────────────────────────
  const [tab, setTab] = React.useState('home')          // 'home' | 'templates' | 'archive'
  const [detailVideoId, setDetailVideoId] = React.useState(null) // open EpisodeDetail
  const [spotlightId, setSpotlightId] = React.useState(null)     // pinned spotlight
  const [showNewEpisode, setShowNewEpisode] = React.useState(false)
  const [appliedTemplate, setAppliedTemplate] = React.useState(null)

  // ── Handlers ──────────────────────────────────
  function openDetail(videoId) {
    setDetailVideoId(videoId)
    dispatch({ type: 'TOUCH_VIDEO', payload: { videoId } })
  }

  function closeDetail() {
    setDetailVideoId(null)
  }

  function handleTabChange(newTab) {
    if (newTab === 'templates') {
      // Templates opens as a drawer, not a tab switch
      setTab('templates')
    } else {
      setTab(newTab)
    }
    // If navigating to home while detail is open, close detail
    if (newTab === 'home' && detailVideoId) {
      setDetailVideoId(null)
    }
  }

  function handleApplyWorkflow(template) {
    setAppliedTemplate(template)
    setTab('home')
    setShowNewEpisode(true)
  }

  function handleEpisodeCreated(videoId) {
    setSpotlightId(videoId)
    setTab('home')
    setAppliedTemplate(null)
  }

  // ── Loading screen ─────────────────────────────
  if (!loaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--bg-primary)',
      }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          style={{ fontSize: 36 }}
        >
          🎬
        </motion.div>
        <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>LOADING…</span>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          background: 'var(--bg-primary)',
          maxWidth: 430,
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Main content area ─────────────────── */}
        <div style={{ flex: 1, overflow: 'hidden', paddingBottom: 'var(--nav-height)' }}>
          <AnimatePresence mode="wait">

            {/* Episode Detail — overlays current tab */}
            {detailVideoId ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
                <EpisodeDetail videoId={detailVideoId} onBack={closeDetail} />
              </motion.div>

            ) : tab === 'home' ? (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ height: '100%', overflowY: 'auto' }}
              >
                <SpotlightView
                  spotlightId={spotlightId}
                  onSetSpotlight={id => setSpotlightId(id)}
                  onOpenDetail={openDetail}
                  onNewEpisode={() => setShowNewEpisode(true)}
                />
              </motion.div>

            ) : tab === 'archive' ? (
              <motion.div
                key="archive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ height: '100%', overflowY: 'auto' }}
              >
                <ArchiveView onOpenDetail={openDetail} />
              </motion.div>

            ) : null}
          </AnimatePresence>
        </div>

        {/* ── Bottom Nav ────────────────────────── */}
        <BottomNav
          activeTab={detailVideoId ? 'home' : tab}
          onTabChange={handleTabChange}
        />

        {/* ── Template Drawer ───────────────────── */}
        <TemplateDrawer
          isOpen={tab === 'templates' && !detailVideoId}
          onClose={() => setTab('home')}
          onApplyWorkflow={handleApplyWorkflow}
        />

        {/* ── New Episode Modal ─────────────────── */}
        <NewEpisodeModal
          isOpen={showNewEpisode}
          onClose={() => { setShowNewEpisode(false); setAppliedTemplate(null) }}
          onCreated={handleEpisodeCreated}
          appliedTemplate={appliedTemplate}
        />
      </div>
    </AppContext.Provider>
  )
}

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COLORS = ['#C4956A', '#D4A574', '#5A8F5A', '#7B9EC4', '#B07CC6', '#A8B87B', '#E8DDD0']

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

function Particle({ color, size, x, y, tx, ty, rotation, delay }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: size,
        height: size,
        background: color,
        borderRadius: Math.random() > 0.5 ? '50%' : 2,
        pointerEvents: 'none',
      }}
      initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ x: tx, y: ty, opacity: 0, rotate: rotation, scale: 0.3 }}
      transition={{ duration: randomBetween(0.5, 0.9), delay, ease: 'easeOut' }}
    />
  )
}

export default function ConfettiBurst({ trigger, count = 20, fullScreen = false }) {
  const [key, setKey] = React.useState(0)
  const [particles, setParticles] = React.useState([])

  React.useEffect(() => {
    if (!trigger) return
    const p = Array.from({ length: count }, (_, i) => ({
      id: i,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: randomBetween(5, fullScreen ? 10 : 7),
      x: 0,
      y: 0,
      tx: randomBetween(fullScreen ? -180 : -80, fullScreen ? 180 : 80),
      ty: randomBetween(fullScreen ? -200 : -100, fullScreen ? 60 : 40),
      rotation: randomBetween(-360, 360),
      delay: randomBetween(0, 0.15),
    }))
    setParticles(p)
    setKey(k => k + 1)
  }, [trigger])

  if (!particles.length) return null

  return (
    <div
      style={{
        position: fullScreen ? 'fixed' : 'absolute',
        inset: fullScreen ? 0 : undefined,
        top: fullScreen ? 0 : '50%',
        left: fullScreen ? 0 : '50%',
        pointerEvents: 'none',
        zIndex: 100,
        overflow: fullScreen ? 'hidden' : 'visible',
      }}
    >
      <AnimatePresence>
        {particles.map(p => (
          <Particle key={`${key}-${p.id}`} {...p} />
        ))}
      </AnimatePresence>
    </div>
  )
}

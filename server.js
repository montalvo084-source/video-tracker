// server.js — Local data API server
// Reads and writes your app data to data.json on your Mac.

import express from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || __dirname
const DATA_FILE = resolve(DATA_DIR, 'data.json')

const app = express()
app.use(express.json({ limit: '10mb' }))

// Serve built React frontend in production
app.use(express.static(join(__dirname, 'dist')))

// GET /api/state — load saved data
app.get('/api/state', (req, res) => {
  try {
    if (existsSync(DATA_FILE)) {
      res.json(JSON.parse(readFileSync(DATA_FILE, 'utf-8')))
    } else {
      res.json(null)
    }
  } catch {
    res.json(null)
  }
})

// POST /api/state — save data
app.post('/api/state', (req, res) => {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// Fallback: serve index.html for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

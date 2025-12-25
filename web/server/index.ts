import express from 'express'
import cors from 'cors'
import { topicsRouter } from './routes/topics.js'
import { roadmapRouter } from './routes/roadmap.js'
import { lessonRouter } from './routes/lesson.js'
import { testRouter } from './routes/test.js'
import { hintRouter } from './routes/hint.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// API routes
app.use('/api', topicsRouter)
app.use('/api', roadmapRouter)
app.use('/api', lessonRouter)
app.use('/api', testRouter)
app.use('/api', hintRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`)
})


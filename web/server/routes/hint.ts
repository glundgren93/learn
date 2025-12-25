import { Router } from 'express'
import { loadLesson } from '../../../src/services/filesystem.js'

export const hintRouter = Router()

// GET /api/hint/:topic/:stageId/:index - Get a specific hint
hintRouter.get('/hint/:topic/:stageId/:index', async (req, res) => {
  try {
    const { topic, stageId, index } = req.params
    const hintIndex = parseInt(index, 10)
    
    if (isNaN(hintIndex) || hintIndex < 0) {
      res.status(400).json({ error: 'Invalid hint index' })
      return
    }

    const lesson = await loadLesson(topic, stageId)
    
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' })
      return
    }

    if (hintIndex >= lesson.hints.length) {
      res.status(404).json({ error: 'Hint not found' })
      return
    }

    res.json({
      hint: lesson.hints[hintIndex],
      total: lesson.hints.length,
    })
  } catch (error) {
    console.error('Error getting hint:', error)
    res.status(500).json({ error: 'Failed to get hint' })
  }
})


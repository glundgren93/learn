import { Router } from 'express'
import { z } from 'zod'
import { readFile, writeFile } from 'node:fs/promises'
import { loadLesson, saveLesson, getSolutionPath } from '../../../src/services/filesystem.js'
import { generateLesson } from '../../../src/agent/lesson.js'

export const lessonRouter = Router()

// GET /api/lesson/:topic/:stageId - Get lesson for a stage
lessonRouter.get('/lesson/:topic/:stageId', async (req, res) => {
  try {
    const { topic, stageId } = req.params
    const lesson = await loadLesson(topic, stageId)
    
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' })
      return
    }

    // Also load current solution code
    try {
      const solutionPath = getSolutionPath(topic, stageId)
      const solutionCode = await readFile(solutionPath, 'utf-8')
      res.json({ ...lesson, solutionCode })
    } catch {
      res.json({ ...lesson, solutionCode: lesson.starterCode })
    }
  } catch (error) {
    console.error('Error getting lesson:', error)
    res.status(500).json({ error: 'Failed to get lesson' })
  }
})

// POST /api/lesson/:topic/:stageId - Generate and save a lesson
const generateLessonSchema = z.object({
  stageNumber: z.number().int().positive(),
  model: z.string().optional(),
})

lessonRouter.post('/lesson/:topic/:stageId', async (req, res) => {
  try {
    const { topic, stageId } = req.params
    const { stageNumber, model } = generateLessonSchema.parse(req.body)
    
    // Set model if provided
    if (model) {
      process.env.OPENAI_MODEL = model
    }

    // Generate lesson
    const lesson = await generateLesson(topic, stageId, stageNumber)
    
    // Save lesson files
    await saveLesson(topic, stageId, lesson)

    res.json(lesson)
  } catch (error) {
    console.error('Error generating lesson:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to generate lesson' })
    }
  }
})

// PUT /api/lesson/:topic/:stageId/code - Save solution code
const saveCodeSchema = z.object({
  code: z.string(),
})

lessonRouter.put('/lesson/:topic/:stageId/code', async (req, res) => {
  try {
    const { topic, stageId } = req.params
    const { code } = saveCodeSchema.parse(req.body)
    
    const solutionPath = getSolutionPath(topic, stageId)
    await writeFile(solutionPath, code, 'utf-8')

    res.json({ success: true })
  } catch (error) {
    console.error('Error saving code:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to save code' })
    }
  }
})


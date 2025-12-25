import { Router } from 'express'
import { z } from 'zod'
import { getAllTopicsProgress, initializeProgress, setActiveTopic } from '../../../src/services/progress.js'
import { saveRoadmap } from '../../../src/services/filesystem.js'
import { generateRoadmap } from '../../../src/agent/roadmap.js'

export const topicsRouter = Router()

// GET /api/topics - List all topics with progress
topicsRouter.get('/topics', async (_req, res) => {
  try {
    const topics = await getAllTopicsProgress()
    res.json(topics)
  } catch (error) {
    console.error('Error getting topics:', error)
    res.status(500).json({ error: 'Failed to get topics' })
  }
})

// POST /api/topics - Create a new topic
const createTopicSchema = z.object({
  topic: z.string().min(1),
  model: z.string().optional(),
})

topicsRouter.post('/topics', async (req, res) => {
  try {
    const { topic, model } = createTopicSchema.parse(req.body)
    
    // Set model if provided
    if (model) {
      process.env.OPENAI_MODEL = model
    }

    // Generate roadmap
    const roadmap = await generateRoadmap(topic)
    
    // Create slug from topic
    const slug = roadmap.topic.toLowerCase().replace(/\s+/g, '-')
    
    // Save roadmap
    await saveRoadmap(slug, roadmap)
    
    // Initialize progress
    await initializeProgress(slug, roadmap.stages.length)
    
    // Set as active topic
    await setActiveTopic(slug)

    res.json(roadmap)
  } catch (error) {
    console.error('Error creating topic:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to create topic' })
    }
  }
})


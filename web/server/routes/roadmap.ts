import { Router } from 'express'
import { loadRoadmap } from '../../../src/services/filesystem.js'

export const roadmapRouter = Router()

// GET /api/roadmap/:topic - Get roadmap for a topic
roadmapRouter.get('/roadmap/:topic', async (req, res) => {
  try {
    const { topic } = req.params
    const roadmap = await loadRoadmap(topic)
    
    if (!roadmap) {
      res.status(404).json({ error: 'Roadmap not found' })
      return
    }

    res.json(roadmap)
  } catch (error) {
    console.error('Error getting roadmap:', error)
    res.status(500).json({ error: 'Failed to get roadmap' })
  }
})


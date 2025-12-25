import { Router } from 'express'
import { z } from 'zod'
import { writeFile } from 'node:fs/promises'
import { getSolutionPath, getTestPath } from '../../../src/services/filesystem.js'
import { runTests } from '../../../src/services/testRunner.js'
import { markStageComplete, incrementAttempts } from '../../../src/services/progress.js'
import { loadRoadmap } from '../../../src/services/filesystem.js'

export const testRouter = Router()

// POST /api/test/:topic/:stageId - Run tests for a stage
const runTestsSchema = z.object({
  code: z.string(),
})

testRouter.post('/test/:topic/:stageId', async (req, res) => {
  try {
    const { topic, stageId } = req.params
    const { code } = runTestsSchema.parse(req.body)
    
    // Save the code first
    const solutionPath = getSolutionPath(topic, stageId)
    await writeFile(solutionPath, code, 'utf-8')
    
    // Get test file path
    const testPath = getTestPath(topic, stageId)
    
    // Run tests
    const result = await runTests(testPath)
    
    // Get stage number for progress tracking
    const roadmap = await loadRoadmap(topic)
    if (roadmap) {
      const stageIndex = roadmap.stages.findIndex(s => s.id === stageId)
      const stageNumber = stageIndex + 1
      
      if (result.passed) {
        await markStageComplete(topic, stageNumber)
      } else {
        await incrementAttempts(topic, stageNumber)
      }
    }

    res.json(result)
  } catch (error) {
    console.error('Error running tests:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors })
    } else {
      res.status(500).json({ error: 'Failed to run tests' })
    }
  }
})


import { useState, useEffect } from 'react'
// Lesson page component
import { useParams, Link } from 'react-router-dom'
import { useLesson, useGenerateLesson, useRunTests, useHint } from '../hooks/useLesson'
import { useRoadmap } from '../hooks/useRoadmap'
import { useQuery } from '@tanstack/react-query'
import { getTopics } from '../lib/api'
import type { TestResult } from '../lib/api'
import TheoryPanel from '../components/TheoryPanel'
import CodeEditor from '../components/CodeEditor'
import TestResults from '../components/TestResults'
import StageProgress from '../components/StageProgress'

export default function Lesson() {
  const { topic, stageId } = useParams<{ topic: string; stageId: string }>()
  const { data: lesson, isLoading, error } = useLesson(topic, stageId)
  const { data: roadmap } = useRoadmap(topic)
  const { data: allProgress } = useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
  })
  const generateLesson = useGenerateLesson()
  const runTests = useRunTests()

  const [code, setCode] = useState('')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const progress = allProgress?.find((p) => p.topic === topic) || null
  const stageIndex = roadmap?.stages.findIndex((s) => s.id === stageId) ?? -1
  const stageNumber = stageIndex + 1

  // Load hint
  const { data: hintData } = useHint(topic, stageId, hintsUsed, showHint && hintsUsed < (lesson?.hints.length || 0))

  // Initialize code when lesson loads
  useEffect(() => {
    if (lesson?.solutionCode) {
      setCode(lesson.solutionCode)
    } else if (lesson?.starterCode) {
      setCode(lesson.starterCode)
    }
  }, [lesson])

  // Generate lesson if it doesn't exist
  useEffect(() => {
    if (error && topic && stageId && stageNumber > 0 && !generateLesson.isPending) {
      generateLesson.mutate({ topic, stageId, stageNumber })
    }
  }, [error, topic, stageId, stageNumber, generateLesson])

  const handleRunTests = async () => {
    if (!topic || !stageId) return
    setTestResult(null)
    const result = await runTests.mutateAsync({ topic, stageId, code })
    setTestResult(result)
  }

  const handleRequestHint = () => {
    if (hintsUsed < (lesson?.hints.length || 0)) {
      setShowHint(true)
      setHintsUsed((prev) => prev + 1)
    }
  }

  if (isLoading || generateLesson.isPending) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <svg className="w-10 h-10 animate-spin text-lavender" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-subtext0">
          {generateLesson.isPending ? 'Generating lesson...' : 'Loading lesson...'}
        </p>
      </div>
    )
  }

  if (!lesson && !generateLesson.isPending) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <p className="text-red">Failed to load lesson</p>
        <Link to={`/topics/${topic}`} className="text-lavender hover:underline">
          ← Back to Roadmap
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Theory panel */}
        <div className="w-1/2 border-r border-surface0 bg-mantle/30 min-h-0 flex flex-col">
          <div className="h-10 border-b border-surface0 px-4 flex items-center">
            <span className="text-sm font-medium text-subtext0">Theory</span>
          </div>
          <div className="flex-1 min-h-0">
            <TheoryPanel content={lesson?.theory || ''} />
          </div>
          
          {/* Hint panel */}
          {showHint && hintData && (
            <div className="border-t border-surface0 p-4 bg-yellow/5">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-yellow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-yellow">Hint {hintsUsed}</span>
              </div>
              <p className="text-sm text-subtext0">{hintData.hint}</p>
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="w-1/2 flex flex-col min-h-0 bg-base">
          {/* Editor header */}
          <div className="h-10 border-b border-surface0 px-4 flex items-center justify-between">
            <span className="text-sm font-medium text-subtext0 font-mono">solution.ts</span>
            <button
              onClick={handleRunTests}
              disabled={runTests.isPending}
              className="flex items-center gap-1.5 px-3 py-1 bg-green/10 hover:bg-green/20 text-green text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {runTests.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Run Tests
                </>
              )}
            </button>
          </div>

          {/* Monaco editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor value={code} onChange={setCode} />
          </div>

          {/* Test results */}
          <div className="h-72 border-t-2 border-surface1 bg-crust overflow-auto">
            <div className="h-10 border-b border-surface0 px-4 flex items-center sticky top-0 bg-crust z-10">
              <span className="text-sm font-semibold text-subtext1">Test Results</span>
              {testResult && (
                <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded ${
                  testResult.passed 
                    ? 'bg-green/20 text-green' 
                    : 'bg-red/20 text-red'
                }`}>
                  {testResult.tests.filter(t => t.passed).length}/{testResult.tests.length} passed
                </span>
              )}
            </div>
            <TestResults result={testResult} isLoading={runTests.isPending} />
          </div>
        </div>
      </div>

      {/* Stage progress bar */}
      {roadmap && topic && stageId && (
        <StageProgress
          topic={topic}
          stages={roadmap.stages}
          progress={progress}
          currentStageId={stageId}
          onHint={handleRequestHint}
          hintsUsed={hintsUsed}
          totalHints={lesson?.hints.length || 3}
        />
      )}
    </div>
  )
}


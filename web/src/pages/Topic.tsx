import { useParams, Link, useNavigate } from 'react-router-dom'
import { useRoadmap } from '../hooks/useRoadmap'
import { useQuery } from '@tanstack/react-query'
import { getTopics } from '../lib/api'
import type { Progress, Stage } from '@shared/types/index.js'

export default function Topic() {
  const { topic } = useParams<{ topic: string }>()
  const navigate = useNavigate()
  const { data: roadmap, isLoading, error } = useRoadmap(topic)
  const { data: allProgress } = useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
  })

  const progress = allProgress?.find((p) => p.topic === topic) || null

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-lavender" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (error || !roadmap) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <p className="text-red">Failed to load roadmap</p>
        <Link to="/" className="text-lavender hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const getDifficultyColor = (difficulty: Stage['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green bg-green/10 border-green/20'
      case 'intermediate':
        return 'text-yellow bg-yellow/10 border-yellow/20'
      case 'advanced':
        return 'text-red bg-red/10 border-red/20'
    }
  }

  const getStageStatus = (index: number) => {
    const stageProgress = progress?.stages[(index + 1).toString()]
    return stageProgress?.status || 'locked'
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <Link 
            to="/" 
            className="text-sm text-overlay1 hover:text-lavender transition-colors flex items-center gap-1 mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-text mb-2 capitalize">
            {roadmap.topic.replace(/-/g, ' ')}
          </h1>
          <p className="text-lg text-subtext0">{roadmap.description}</p>
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {roadmap.stages.map((stage, i) => {
            const status = getStageStatus(i)
            const isLocked = status === 'locked'

            return (
              <div
                key={stage.id}
                onClick={() => {
                  if (!isLocked) {
                    navigate(`/topics/${topic}/stages/${stage.id}`)
                  }
                }}
                className={`group relative p-5 rounded-xl border transition-all duration-200 ${
                  isLocked
                    ? 'bg-surface0/30 border-surface1 opacity-60 cursor-not-allowed'
                    : 'bg-surface0/50 border-surface1 hover:border-lavender/50 hover:bg-surface0 cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Stage number */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
                      status === 'completed'
                        ? 'bg-green text-crust'
                        : status === 'in_progress'
                        ? 'bg-yellow text-crust'
                        : 'bg-surface1 text-overlay0'
                    }`}
                  >
                    {status === 'completed' ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-semibold text-lg ${isLocked ? 'text-overlay0' : 'text-text group-hover:text-lavender'} transition-colors`}>
                        {stage.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(stage.difficulty)}`}>
                        {stage.difficulty}
                      </span>
                      {stage.isRealWorldProject && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-mauve/10 text-mauve border border-mauve/20">
                          Capstone
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${isLocked ? 'text-overlay0' : 'text-subtext0'}`}>
                      {stage.objective}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-overlay0">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ~{stage.estimatedMinutes} min
                      </span>
                      {stage.prerequisites.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Requires: {stage.prerequisites.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  {!isLocked && (
                    <svg className="w-5 h-5 text-overlay0 group-hover:text-lavender transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>

                {/* Lock overlay */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-overlay0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


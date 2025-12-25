import { Link } from 'react-router-dom'
import type { Progress, Stage } from '@shared/types/index.js'

interface StageProgressProps {
  topic: string
  stages: Stage[]
  progress: Progress | null
  currentStageId: string
  onHint: () => void
  hintsUsed: number
  totalHints: number
}

export default function StageProgress({
  topic,
  stages,
  progress,
  currentStageId,
  onHint,
  hintsUsed,
  totalHints,
}: StageProgressProps) {
  const currentIndex = stages.findIndex((s) => s.id === currentStageId)

  return (
    <div className="h-14 border-t border-surface0 bg-mantle flex items-center px-6 gap-4">
      <span className="text-sm text-overlay1 shrink-0">Progress:</span>
      
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {stages.map((stage, i) => {
          const stageProgress = progress?.stages[(i + 1).toString()]
          const status = stageProgress?.status || 'locked'
          const isCurrent = stage.id === currentStageId

          return (
            <Link
              key={stage.id}
              to={`/topics/${topic}/stages/${stage.id}`}
              className={`w-3 h-3 rounded-full transition-all duration-200 shrink-0 ${
                status === 'completed'
                  ? 'bg-green hover:bg-green/80'
                  : status === 'in_progress'
                  ? 'bg-yellow hover:bg-yellow/80'
                  : 'bg-surface1 hover:bg-surface2'
              } ${isCurrent ? 'ring-2 ring-lavender ring-offset-2 ring-offset-mantle' : ''}`}
              title={`${stage.title} - ${status}`}
            />
          )
        })}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-overlay0">
          Stage {currentIndex + 1}/{stages.length}
        </span>
        
        <button
          onClick={onHint}
          disabled={hintsUsed >= totalHints}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface0 hover:bg-surface1 disabled:opacity-50 disabled:cursor-not-allowed border border-surface1 rounded-lg text-sm text-text transition-colors"
        >
          <svg className="w-4 h-4 text-yellow" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          Hint ({hintsUsed}/{totalHints})
        </button>
      </div>
    </div>
  )
}


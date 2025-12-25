import { Link } from 'react-router-dom'
import type { Progress } from '@shared/types/index.js'

interface TopicCardProps {
  progress: Progress
}

export default function TopicCard({ progress }: TopicCardProps) {
  const totalStages = Object.keys(progress.stages).length
  const completedStages = Object.values(progress.stages).filter(
    (s) => s.status === 'completed'
  ).length
  const progressPercent = (completedStages / totalStages) * 100

  return (
    <Link
      to={`/topics/${progress.topic}`}
      className="group block bg-surface0/50 border border-surface1 rounded-xl p-5 hover:border-lavender/50 hover:bg-surface0 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-lg text-text group-hover:text-lavender transition-colors capitalize">
          {progress.topic.replace(/-/g, ' ')}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-surface1 text-subtext0">
          {completedStages}/{totalStages}
        </span>
      </div>

      <div className="h-1.5 bg-surface1 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-lavender to-mauve rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-subtext0">
        {completedStages === totalStages ? (
          <>
            <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green">Completed</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-yellow" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>Stage {progress.currentStage} in progress</span>
          </>
        )}
      </div>
    </Link>
  )
}


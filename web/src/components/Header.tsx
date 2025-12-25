import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTopics } from '../hooks/useTopics'
import ModelSelector from './ModelSelector'

export default function Header() {
  const { topic } = useParams<{ topic: string }>()
  const { data: topics } = useTopics()
  const navigate = useNavigate()

  return (
    <header className="h-14 border-b border-surface0 bg-mantle/80 backdrop-blur-sm flex items-center px-6 gap-6 sticky top-0 z-50">
      <Link 
        to="/" 
        className="flex items-center gap-2 text-lavender hover:text-mauve transition-colors"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-6 h-6"
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
        <span className="font-semibold text-lg tracking-tight">Learn</span>
      </Link>

      {topics && topics.length > 0 && (
        <div className="relative">
          <select
            value={topic || ''}
            onChange={(e) => {
              if (e.target.value) {
                navigate(`/topics/${e.target.value}`)
              }
            }}
            className="appearance-none bg-surface0 border border-surface1 rounded-lg px-3 py-1.5 pr-8 text-sm text-text hover:border-surface2 focus:border-lavender focus:outline-none cursor-pointer transition-colors"
          >
            <option value="">Select topic...</option>
            {topics.map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.topic}
              </option>
            ))}
          </select>
          <svg 
            className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-overlay1"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}

      <div className="flex-1" />

      <ModelSelector />
    </header>
  )
}


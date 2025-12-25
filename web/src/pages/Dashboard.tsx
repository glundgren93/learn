import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopics, useCreateTopic } from '../hooks/useTopics'
import TopicCard from '../components/TopicCard'

export default function Dashboard() {
  const { data: topics, isLoading, error } = useTopics()
  const createTopic = useCreateTopic()
  const navigate = useNavigate()
  const [newTopic, setNewTopic] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopic.trim()) return

    try {
      const roadmap = await createTopic.mutateAsync(newTopic.trim())
      const slug = roadmap.topic.toLowerCase().replace(/\s+/g, '-')
      navigate(`/topics/${slug}`)
    } catch (err) {
      console.error('Failed to create topic:', err)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-lavender via-mauve to-pink bg-clip-text text-transparent">
            Welcome to Learn
          </h1>
          <p className="text-lg text-subtext0 max-w-xl mx-auto">
            Master programming concepts through AI-generated, test-driven lessons.
            Pick a topic and start your journey.
          </p>
        </div>

        {/* New topic form */}
        <div className="mb-10">
          <form onSubmit={handleCreate} className="flex gap-3 max-w-xl mx-auto">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Enter a topic to learn (e.g., 'binary search trees')"
              className="flex-1 bg-surface0 border border-surface1 rounded-xl px-4 py-3 text-text placeholder-overlay0 focus:border-lavender focus:outline-none focus:ring-2 focus:ring-lavender/20 transition-all"
            />
            <button
              type="submit"
              disabled={createTopic.isPending || !newTopic.trim()}
              className="px-6 py-3 bg-gradient-to-r from-lavender to-mauve text-crust font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
            >
              {createTopic.isPending ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Start Learning
                </>
              )}
            </button>
          </form>
          {createTopic.error && (
            <p className="text-red text-sm text-center mt-2">
              {createTopic.error.message}
            </p>
          )}
        </div>

        {/* Topics grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="w-8 h-8 animate-spin text-lavender" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red">Failed to load topics</p>
          </div>
        ) : topics && topics.length > 0 ? (
          <>
            <h2 className="text-xl font-semibold text-text mb-6">Your Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((progress) => (
                <TopicCard key={progress.topic} progress={progress} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-surface1 rounded-2xl">
            <svg className="w-16 h-16 mx-auto text-overlay0 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-overlay1 text-lg">No topics yet</p>
            <p className="text-overlay0 text-sm mt-1">Enter a topic above to start learning</p>
          </div>
        )}
      </div>
    </div>
  )
}


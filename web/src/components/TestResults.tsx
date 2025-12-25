import type { TestResult } from '../lib/api'

// Test Results Component - updated for better visibility
interface TestResultsProps {
  result: TestResult | null
  isLoading: boolean
}

export default function TestResults({ result, isLoading }: TestResultsProps) {
  if (isLoading) {
    return (
      <div className="p-4 flex items-center gap-3 text-lavender">
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="font-medium">Running tests...</span>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="p-4 text-subtext0 text-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Click "Run Tests" to check your solution
      </div>
    )
  }

  // Sort tests: failed first, then passed
  const sortedTests = [...result.tests].sort((a, b) => {
    if (a.passed === b.passed) return 0
    return a.passed ? 1 : -1
  })

  return (
    <div className="p-4 space-y-3">
      {/* Summary banner */}
      <div className={`flex items-center gap-3 p-3 rounded-lg ${
        result.passed 
          ? 'bg-green/10 border border-green/30' 
          : 'bg-red/10 border border-red/30'
      }`}>
        {result.passed ? (
          <>
            <div className="w-8 h-8 rounded-full bg-green/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-green">All tests passed!</div>
              <div className="text-xs text-green/70">{result.tests.length} test{result.tests.length !== 1 ? 's' : ''} completed successfully</div>
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full bg-red/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-red">
                {result.tests.filter(t => !t.passed).length} test{result.tests.filter(t => !t.passed).length !== 1 ? 's' : ''} failed
              </div>
              <div className="text-xs text-subtext0">
                {result.tests.filter(t => t.passed).length} of {result.tests.length} tests passing
              </div>
            </div>
          </>
        )}
      </div>

      {/* Individual test results */}
      <div className="space-y-2">
        {sortedTests.map((test, i) => (
          <div
            key={i}
            className={`rounded-lg border transition-colors ${
              test.passed
                ? 'bg-surface0/30 border-surface1 hover:border-green/30'
                : 'bg-red/5 border-red/30 hover:border-red/50'
            }`}
          >
            <div className={`flex items-center gap-2 px-3 py-2.5 ${!test.passed && (test.error || test.expected) ? 'border-b border-red/20' : ''}`}>
              {test.passed ? (
                <svg className="w-4 h-4 text-green shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`text-sm font-medium ${test.passed ? 'text-subtext1' : 'text-red'}`}>
                {test.name}
              </span>
            </div>

            {!test.passed && (test.error || test.expected) && (
              <div className="px-3 py-2.5 bg-crust/50 rounded-b-lg space-y-2">
                {test.error && (
                  <div className="text-sm text-red/90 font-mono leading-relaxed whitespace-pre-wrap">
                    {test.error}
                  </div>
                )}

                {test.expected && (
                  <div className="text-sm space-y-1.5 font-mono">
                    <div className="flex items-start gap-2">
                      <span className="text-overlay1 shrink-0 w-20">Expected:</span>
                      <span className="text-green bg-green/10 px-1.5 py-0.5 rounded">{test.expected}</span>
                    </div>
                    {test.received && (
                      <div className="flex items-start gap-2">
                        <span className="text-overlay1 shrink-0 w-20">Received:</span>
                        <span className="text-red bg-red/10 px-1.5 py-0.5 rounded">{test.received}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


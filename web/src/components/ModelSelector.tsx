import { useState, useEffect } from 'react'
import { getStoredModel, setStoredModel } from '../lib/api'

const MODELS = [
  { value: 'gpt-5.2', label: 'GPT-5.2' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'custom', label: 'Custom...' },
]

export default function ModelSelector() {
  const [model, setModel] = useState(getStoredModel)
  const [isCustom, setIsCustom] = useState(!MODELS.some(m => m.value === getStoredModel()))
  const [customValue, setCustomValue] = useState(isCustom ? getStoredModel() : '')

  useEffect(() => {
    if (isCustom && customValue) {
      setStoredModel(customValue)
    } else if (!isCustom) {
      setStoredModel(model)
    }
  }, [model, isCustom, customValue])

  const handleChange = (value: string) => {
    if (value === 'custom') {
      setIsCustom(true)
    } else {
      setIsCustom(false)
      setModel(value)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-overlay1">Model:</span>
      {isCustom ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="model-name"
            className="bg-surface0 border border-surface1 rounded-lg px-2 py-1 text-sm text-text w-32 focus:border-lavender focus:outline-none"
          />
          <button
            onClick={() => {
              setIsCustom(false)
              setModel('gpt-4o')
            }}
            className="text-overlay1 hover:text-text p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <select
            value={model}
            onChange={(e) => handleChange(e.target.value)}
            className="appearance-none bg-surface0 border border-surface1 rounded-lg px-2 py-1 pr-7 text-sm text-text hover:border-surface2 focus:border-lavender focus:outline-none cursor-pointer transition-colors"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <svg 
            className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-overlay1"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
    </div>
  )
}


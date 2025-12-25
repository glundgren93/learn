import type { Lesson, Progress, Roadmap } from '@shared/types/index.js'

const API_BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  
  return response.json()
}

// Topics / Progress
export async function getTopics(): Promise<Progress[]> {
  return fetchJson<Progress[]>('/topics')
}

export async function createTopic(topic: string, model?: string): Promise<Roadmap> {
  return fetchJson<Roadmap>('/topics', {
    method: 'POST',
    body: JSON.stringify({ topic, model }),
  })
}

// Roadmap
export async function getRoadmap(topic: string): Promise<Roadmap> {
  return fetchJson<Roadmap>(`/roadmap/${encodeURIComponent(topic)}`)
}

// Lessons
export async function getLesson(topic: string, stageId: string): Promise<Lesson & { solutionCode: string }> {
  return fetchJson<Lesson & { solutionCode: string }>(
    `/lesson/${encodeURIComponent(topic)}/${encodeURIComponent(stageId)}`
  )
}

export async function generateLesson(
  topic: string, 
  stageId: string, 
  stageNumber: number,
  model?: string
): Promise<Lesson> {
  return fetchJson<Lesson>(
    `/lesson/${encodeURIComponent(topic)}/${encodeURIComponent(stageId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ stageNumber, model }),
    }
  )
}

// Tests
export interface TestCase {
  name: string
  passed: boolean
  error?: string
  expected?: string
  received?: string
}

export interface TestResult {
  passed: boolean
  tests: TestCase[]
}

export async function runTests(
  topic: string, 
  stageId: string, 
  code: string
): Promise<TestResult> {
  return fetchJson<TestResult>(
    `/test/${encodeURIComponent(topic)}/${encodeURIComponent(stageId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ code }),
    }
  )
}

// Hints
export async function getHint(
  topic: string,
  stageId: string,
  hintIndex: number
): Promise<{ hint: string; total: number }> {
  return fetchJson<{ hint: string; total: number }>(
    `/hint/${encodeURIComponent(topic)}/${encodeURIComponent(stageId)}/${hintIndex}`
  )
}

// Model stored in localStorage
export function getStoredModel(): string {
  return localStorage.getItem('learn-model') || 'gpt-4o'
}

export function setStoredModel(model: string): void {
  localStorage.setItem('learn-model', model)
}


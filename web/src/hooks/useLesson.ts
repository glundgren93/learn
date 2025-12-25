import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLesson, generateLesson, runTests, getHint, getStoredModel } from '../lib/api'
import type { TestResult } from '../lib/api'

export function useLesson(topic: string | undefined, stageId: string | undefined) {
  return useQuery({
    queryKey: ['lesson', topic, stageId],
    queryFn: () => getLesson(topic!, stageId!),
    enabled: !!topic && !!stageId,
    retry: false,
  })
}

export function useGenerateLesson() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ topic, stageId, stageNumber }: { 
      topic: string
      stageId: string
      stageNumber: number 
    }) => generateLesson(topic, stageId, stageNumber, getStoredModel()),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['lesson', variables.topic, variables.stageId] 
      })
    },
  })
}

export function useRunTests() {
  return useMutation({
    mutationFn: ({ topic, stageId, code }: { 
      topic: string
      stageId: string
      code: string 
    }): Promise<TestResult> => runTests(topic, stageId, code),
  })
}

export function useHint(
  topic: string | undefined, 
  stageId: string | undefined,
  hintIndex: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['hint', topic, stageId, hintIndex],
    queryFn: () => getHint(topic!, stageId!, hintIndex),
    enabled: enabled && !!topic && !!stageId,
  })
}


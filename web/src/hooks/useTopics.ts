import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTopics, createTopic, getStoredModel } from '../lib/api'

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
  })
}

export function useCreateTopic() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (topic: string) => createTopic(topic, getStoredModel()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })
}


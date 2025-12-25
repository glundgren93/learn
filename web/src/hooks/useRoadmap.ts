import { useQuery } from '@tanstack/react-query'
import { getRoadmap } from '../lib/api'

export function useRoadmap(topic: string | undefined) {
  return useQuery({
    queryKey: ['roadmap', topic],
    queryFn: () => getRoadmap(topic!),
    enabled: !!topic,
  })
}


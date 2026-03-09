import { useEffect, useState } from 'react'
import type { Champion } from '../types'
import { loadChampions } from '../utils/ddragon'

interface UseChampionsResult {
  champions: Champion[]
  loading: boolean
  error: string | null
}

export function useChampions(): UseChampionsResult {
  const [champions, setChampions] = useState<Champion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadChampions()
      .then((data) => {
        setChampions(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load champions')
        setLoading(false)
      })
  }, [])

  return { champions, loading, error }
}

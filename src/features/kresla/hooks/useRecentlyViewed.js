import { useCallback } from 'react'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'

const MAX = 6

export function useRecentlyViewed() {
  const getIds = useCallback(() => {
    const list = readJSON(STORAGE_KEYS.recentlyViewed, [])
    return Array.isArray(list) ? list.slice(0, MAX) : []
  }, [])

  const addProduct = useCallback((productId) => {
    if (!productId) return
    const id = String(productId)
    const prev = getIds().filter((x) => x !== id)
    writeJSON(STORAGE_KEYS.recentlyViewed, [id, ...prev].slice(0, MAX))
  }, [getIds])

  return { getIds, addProduct }
}

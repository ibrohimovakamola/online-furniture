import { useCallback, useState } from 'react'
import { DEFAULT_FURNITURE_SIZE } from '../constants'

/**
 * @typedef {{
 *   id: string,
 *   productId: string,
 *   name: string,
 *   imageUrl: string,
 *   x: number,
 *   y: number,
 *   width: number,
 *   height: number,
 *   rotation: number,
 * }} PlacedItem
 */

function createInstanceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function usePlacedFurniture() {
  const [placed, setPlaced] = useState(/** @type {PlacedItem[]} */ ([]))
  const [selectedId, setSelectedId] = useState(/** @type {string | null} */ (null))

  const addFromCatalog = useCallback(
    (catalogItem, position) => {
      const offset = placed.length * 16
      const next = {
        id: createInstanceId(),
        productId: catalogItem.id,
        name: catalogItem.name,
        imageUrl: catalogItem.imageUrl,
        x: position?.x ?? 72 + offset,
        y: position?.y ?? 96 + offset,
        width: DEFAULT_FURNITURE_SIZE.width,
        height: DEFAULT_FURNITURE_SIZE.height,
        rotation: 0,
      }

      setPlaced((prev) => [...prev, next])
      setSelectedId(next.id)
    },
    [placed.length]
  )

  const updateItem = useCallback((id, patch) => {
    setPlaced((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const removeItem = useCallback((id) => {
    setPlaced((prev) => prev.filter((item) => item.id !== id))
    setSelectedId((current) => (current === id ? null : current))
  }, [])

  const selectItem = useCallback((id) => {
    setSelectedId(id)
  }, [])

  return {
    placed,
    selectedId,
    addFromCatalog,
    updateItem,
    removeItem,
    selectItem,
  }
}

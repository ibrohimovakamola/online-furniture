import { useCallback, useSyncExternalStore } from 'react'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'

const MAX = 3
let listeners = []
let snapshot = []

function refreshSnapshot() {
  const list = readJSON(STORAGE_KEYS.compareList, [])
  snapshot = Array.isArray(list) ? list.slice(0, MAX) : []
}

function getSnapshot() {
  return snapshot
}

function emit() {
  refreshSnapshot()
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

refreshSnapshot()

export function useCompare() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const toggle = useCallback((product) => {
    if (!product?.id) return
    const id = String(product.id)
    const current = [...snapshot]
    const exists = current.find((p) => String(p.id) === id)
    let next
    if (exists) {
      next = current.filter((p) => String(p.id) !== id)
    } else if (current.length >= MAX) {
      next = [...current.slice(1), product]
    } else {
      next = [...current, product]
    }
    writeJSON(STORAGE_KEYS.compareList, next)
    emit()
  }, [])

  const remove = useCallback((productId) => {
    writeJSON(
      STORAGE_KEYS.compareList,
      snapshot.filter((p) => String(p.id) !== String(productId))
    )
    emit()
  }, [])

  const clear = useCallback(() => {
    writeJSON(STORAGE_KEYS.compareList, [])
    emit()
  }, [])

  const isSelected = useCallback(
    (productId) => list.some((p) => String(p.id) === String(productId)),
    [list]
  )

  return { list, toggle, remove, clear, isSelected, max: MAX }
}

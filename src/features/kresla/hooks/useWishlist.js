import { useCallback, useSyncExternalStore } from 'react'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'

let listeners = []
let snapshot = []

function refreshSnapshot() {
  const list = readJSON(STORAGE_KEYS.wishlist, [])
  snapshot = Array.isArray(list) ? list : []
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

export function useWishlist() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const add = useCallback((item) => {
    const current = [...snapshot]
    if (current.some((i) => String(i.id) === String(item.id))) return
    writeJSON(STORAGE_KEYS.wishlist, [...current, { ...item, quantity: item.quantity || 1 }])
    emit()
  }, [])

  const remove = useCallback((id) => {
    writeJSON(
      STORAGE_KEYS.wishlist,
      snapshot.filter((i) => String(i.id) !== String(id))
    )
    emit()
  }, [])

  return { list, add, remove }
}

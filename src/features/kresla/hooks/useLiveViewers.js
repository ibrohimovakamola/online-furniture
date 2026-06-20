import { useMemo, useState } from 'react'
import { useInterval } from './useInterval'

function seededCount(productId, min, max) {
  const str = String(productId || '0')
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % 100000
  }
  const range = max - min + 1
  return min + (hash % range)
}

export function useLiveViewers(productId) {
  const base = useMemo(() => seededCount(productId, 8, 34), [productId])
  const [viewers, setViewers] = useState(base)

  useInterval(() => {
    const delta = Math.floor(Math.random() * 7) - 3
    setViewers((v) => Math.min(34, Math.max(8, v + delta)))
  }, 15000)

  return viewers
}

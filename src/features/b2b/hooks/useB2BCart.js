import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'kresla_b2b_cart'

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

/**
 * @typedef {{ productId: string, name: string, sku?: string, image?: string, quantity: number, unitPrice: number, retailPrice?: number, color?: string }} CartLine
 */

export function useB2BCart() {
  const [items, setItems] = useState(readCart)

  useEffect(() => {
    writeCart(items)
  }, [items])

  const addItem = useCallback((line) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === line.productId && (i.color || '') === (line.color || '')
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + (line.quantity || 1) }
        return next
      }
      return [...prev, { ...line, quantity: line.quantity || 1 }]
    })
  }, [])

  const updateQty = useCallback((productId, quantity, color = '') => {
    const qty = Math.max(Number(quantity) || 1, 1)
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && (i.color || '') === color ? { ...i, quantity: qty } : i
      )
    )
  }, [])

  const removeItem = useCallback((productId, color = '') => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && (i.color || '') === color))
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    [items]
  )

  const itemCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])

  return { items, addItem, updateQty, removeItem, clearCart, subtotal, itemCount }
}

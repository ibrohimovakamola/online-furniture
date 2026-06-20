import { useMemo, useState } from 'react'
import { useInterval } from './useInterval'

function calcLeft(target) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now())
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { days, hours, minutes, seconds, done: diff <= 0 }
}

export function useCountdown(targetDate) {
  const target = useMemo(() => targetDate, [targetDate])
  const [left, setLeft] = useState(() => calcLeft(target))

  useInterval(() => setLeft(calcLeft(target)), 1000)

  const formatted = `${left.days}k ${String(left.hours).padStart(2, '0')}:${String(left.minutes).padStart(2, '0')}:${String(left.seconds).padStart(2, '0')}`

  return { ...left, formatted }
}

export function getFlashSaleEndDate() {
  const key = 'kresla_flashSaleEnd'
  let end = localStorage.getItem(key)
  if (!end) {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    end = d.toISOString()
    localStorage.setItem(key, end)
  }
  return end
}

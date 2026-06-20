import { Check } from 'lucide-react'
import { ORDER_TIMELINE_STEPS } from '../../data/b2bContent'

function stepDone(step, order) {
  if (step.key === 'payment') {
    return order.paymentStatus === 'paid' || ['net30', 'net60'].includes(order.paymentMethod)
  }
  if (step.statuses) {
    const orderIdx = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status)
    const minStatus = step.statuses[0]
    const minIdx = ['pending', 'processing', 'shipped', 'delivered'].indexOf(minStatus)
    return orderIdx >= minIdx && order.status !== 'cancelled'
  }
  return false
}

function stepCurrent(step, order, steps, idx) {
  const done = stepDone(step, order)
  const prevDone = idx === 0 || stepDone(steps[idx - 1], order)
  return !done && prevDone
}

export default function OrderTimeline({ order }) {
  if (order.status === 'cancelled') {
    return <p className="text-sm text-red-600">This order was cancelled.</p>
  }

  return (
    <ol className="relative border-l border-[#0b3c3c]/20 ml-3 space-y-6">
      {ORDER_TIMELINE_STEPS.map((step, idx) => {
        const done = stepDone(step, order)
        const current = stepCurrent(step, order, ORDER_TIMELINE_STEPS, idx)
        return (
          <li key={step.key} className="ml-6">
            <span
              className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                done
                  ? 'bg-kresla-primary border-kresla-primary text-white'
                  : current
                    ? 'bg-white border-kresla-primary text-kresla-primary'
                    : 'bg-white border-gray-200 text-gray-300'
              }`}
            >
              {done && <Check className="w-3.5 h-3.5" />}
            </span>
            <p className={`text-sm font-medium ${done || current ? 'text-kresla-dark' : 'text-gray-400'}`}>
              {step.label}
              {current && <span className="ml-2 text-xs text-kresla-primary">(current)</span>}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

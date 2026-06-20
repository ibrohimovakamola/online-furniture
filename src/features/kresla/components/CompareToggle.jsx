import { Scale } from 'lucide-react'
import { useCompare } from '../hooks/useCompare'
import { useToast } from '../context/ToastContext'

export default function CompareToggle({ product, className = '' }) {
  const { toggle, isSelected, max, list } = useCompare()
  const toast = useToast()
  const selected = isSelected(product?.id)

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selected && list.length >= max) {
      toast.info(`Eng ko'pi bilan ${max} ta mahsulot taqqoslash mumkin`)
    }
    toggle(product)
    toast.success(selected ? 'Taqqoslashdan olib tashlandi' : 'Taqqoslashga qo\'shildi')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
        selected
          ? 'border-kresla-primary bg-kresla-primary/10 text-kresla-primary'
          : 'border-gray-200 text-gray-600 hover:border-kresla-primary'
      } ${className}`}
      title="Taqqoslashga qo'shish"
    >
      <Scale className="h-3.5 w-3.5" />
      {selected ? 'Tanlangan' : 'Taqqoslash'}
    </button>
  )
}

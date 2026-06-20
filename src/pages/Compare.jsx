import { Link } from 'react-router-dom'
import { useCompare } from '../features/kresla/hooks/useCompare'
import { usePageSEO } from '../features/kresla/hooks/usePageSEO'
import { formatSom } from '../features/kresla/utils/formatPrice'
import { getProductImageSource } from '../features/admin/utils/imageUrl'

const ROWS = [
  { key: 'image', label: 'Rasm' },
  { key: 'price', label: 'Narx' },
  { key: 'material', label: 'Material' },
  { key: 'dimensions', label: 'O\'lcham' },
  { key: 'color', label: 'Rang' },
  { key: 'rating', label: 'Reyting' },
  { key: 'warranty', label: 'Kafolat' },
]

function cellValue(product, key) {
  switch (key) {
    case 'image':
      return (
        <img
          src={getProductImageSource(product)}
          alt=""
          className="w-24 h-24 object-cover rounded mx-auto"
        />
      )
    case 'price':
      return formatSom(product.price)
    case 'material':
      return product.filters?.material || product.selectedMaterial || '—'
    case 'dimensions':
      return product.dimensions
        ? `${product.dimensions.width || '—'}×${product.dimensions.depth || '—'} sm`
        : '—'
    case 'color':
      return product.colors?.[0] || product.filters?.color || '—'
    case 'rating':
      return '★★★★☆'
    case 'warranty':
      return '12 oy'
    default:
      return '—'
  }
}

export default function Compare() {
  const { list, remove } = useCompare()

  usePageSEO({
    title: 'Mahsulotlarni taqqoslash — Kresla',
    description: 'Tanlangan mebellarni yonma-yon taqqoslang.',
  })

  if (!list.length) {
    return (
      <div className="container mx-auto max-w-[1360px] px-3 py-16 text-center">
        <p className="text-gray-600 mb-4">Taqqoslash uchun mahsulot tanlanmagan</p>
        <Link to="/products" className="text-kresla-primary font-medium underline">
          Katalogga o&apos;tish
        </Link>
      </div>
    )
  }

  return (
    <div className="py-10 container mx-auto max-w-[1360px] px-3 overflow-x-auto">
      <h1 className="text-2xl font-semibold text-kresla-dark mb-6">Taqqoslash</h1>
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left p-3 border-b bg-gray-50 w-32" />
            {list.map((p) => (
              <th key={p.id} className="p-3 border-b text-center min-w-[160px]">
                <p className="font-medium mb-2 line-clamp-2">{p.title || p.name}</p>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Taqqoslashdan olib tashlash
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key} className="border-b">
              <td className="p-3 font-medium text-gray-600 bg-gray-50">{row.label}</td>
              {list.map((p) => (
                <td key={`${p.id}-${row.key}`} className="p-3 text-center align-middle">
                  {cellValue(p, row.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

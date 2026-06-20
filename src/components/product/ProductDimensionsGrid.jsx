import { MoveRight, Ruler, Layers } from 'lucide-react'

function formatDim(value, unit = 'cm') {
  if (value == null || value === '' || Number.isNaN(Number(value))) return '—'
  return `${value} ${unit}`
}

function ProductDimensionsGrid({ dimensions }) {
  const unit = dimensions?.unit || 'cm'
  const specs = [
    { key: 'width', label: 'Eni (Width)', value: dimensions?.width, icon: MoveRight },
    { key: 'height', label: 'Balandligi (Height)', value: dimensions?.height, icon: Ruler },
    { key: 'depth', label: 'Chuqurligi (Depth)', value: dimensions?.depth, icon: Layers },
  ]

  const hasAny = specs.some((s) => s.value != null && s.value !== '')

  return (
    <div className="product-dimensions">
      <h3 className="product-dimensions__title">Dimensions &amp; Specs</h3>
      {!hasAny ? (
        <p className="product-dimensions__empty">
          Aniq o‘lchamlar uchun biz bilan bog‘laning — mahsulot bo‘yicha individual o‘lchov mavjud.
        </p>
      ) : (
        <div className="product-dimensions__grid">
          {specs.map((spec) => {
            const DimensionIcon = spec.icon
            return (
            <div key={spec.key} className="product-dimensions__cell">
              <span className="product-dimensions__icon" aria-hidden>
                <DimensionIcon size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="product-dimensions__label">{spec.label}</p>
                <p className="product-dimensions__value">{formatDim(spec.value, unit)}</p>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProductDimensionsGrid

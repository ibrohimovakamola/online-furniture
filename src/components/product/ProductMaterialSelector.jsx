import { DEFAULT_MATERIAL_OPTIONS } from '../../constants/premiumServices'

function ProductMaterialSelector({ options = [], selectedMaterial, onSelect }) {
  const list = options.length > 0 ? options : DEFAULT_MATERIAL_OPTIONS
  if (!list.length) return null

  return (
    <div className="product-customizer">
      <p className="product-customizer__label">Mato / material</p>
      <div className="product-customizer__materials" role="radiogroup" aria-label="Material tanlash">
        {list.map((material) => {
          const active = selectedMaterial === material
          return (
            <button
              key={material}
              type="button"
              role="radio"
              aria-checked={active}
              className={`product-material-pill ${active ? 'product-material-pill--active' : ''}`}
              onClick={() => onSelect(material)}
            >
              {material}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ProductMaterialSelector

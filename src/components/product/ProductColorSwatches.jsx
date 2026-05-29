import { normalizeHexColor } from '../../features/admin/utils/colorUtils'

function ProductColorSwatches({ colors = [], selectedColor, onSelect }) {
  if (!colors.length) return null

  return (
    <div className="product-customizer">
      <p className="product-customizer__label">Rang</p>
      <div className="product-customizer__swatches" role="listbox" aria-label="Rang tanlash">
        {colors.map((raw) => {
          const hex = normalizeHexColor(raw) || raw
          const active = selectedColor === raw || selectedColor === hex
          return (
            <button
              key={raw}
              type="button"
              role="option"
              aria-selected={active}
              className={`product-swatch ${active ? 'product-swatch--active' : ''}`}
              style={{ '--swatch-color': hex }}
              onClick={() => onSelect(raw)}
              title={hex}
            />
          )
        })}
      </div>
      {selectedColor && (
        <p className="product-customizer__hint">{normalizeHexColor(selectedColor) || selectedColor}</p>
      )}
    </div>
  )
}

export default ProductColorSwatches

import { B2B_MATERIALS } from '../../data/b2bContent'

export default function CatalogFilters({ filters, categories, onChange, colorOptions = [] }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <aside className="rounded-xl border border-[#0b3c3c]/10 bg-white p-5 space-y-6 lg:sticky lg:top-4">
      <h2 className="font-semibold text-kresla-dark">Filters</h2>

      <div>
        <label className="text-xs font-semibold uppercase text-gray-500">Search</label>
        <input
          type="search"
          value={filters.search || ''}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Name or SKU…"
          className="mt-1 w-full rounded-lg border border-[#0b3c3c]/20 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Category</p>
        <select
          value={filters.category || ''}
          onChange={(e) => set('category', e.target.value)}
          className="w-full rounded-lg border border-[#0b3c3c]/20 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Material</p>
        <select
          value={filters.material || ''}
          onChange={(e) => set('material', e.target.value)}
          className="w-full rounded-lg border border-[#0b3c3c]/20 px-3 py-2 text-sm"
        >
          <option value="">Any material</option>
          {B2B_MATERIALS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {colorOptions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => set('color', filters.color === c ? '' : c)}
                className={`w-7 h-7 rounded-full border-2 ${filters.color === c ? 'border-kresla-primary ring-2 ring-kresla-primary/30' : 'border-gray-200'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Price range (wholesale)</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => set('minPrice', e.target.value)}
            className="w-full rounded-lg border border-[#0b3c3c]/20 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => set('maxPrice', e.target.value)}
            className="w-full rounded-lg border border-[#0b3c3c]/20 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {[
          ['inStock', 'In stock only'],
          ['b2bOnly', 'B2B exclusive'],
          ['newArrivals', 'New arrivals'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters[key]}
              onChange={(e) => set(key, e.target.checked)}
              className="rounded text-kresla-primary"
            />
            {label}
          </label>
        ))}
      </div>
    </aside>
  )
}

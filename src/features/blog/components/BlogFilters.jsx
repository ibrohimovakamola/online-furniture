import { Search } from 'lucide-react'
import { BLOG_CATEGORIES } from '../constants'

export default function BlogFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  total = 0,
}) {
  return (
    <div>
      <div className="blog-filters">
        <div className="blog-filters__search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Maqolalarni qidirish…"
            aria-label="Blog postlarini qidirish"
          />
        </div>

        <div className="blog-filters__sort">
          <label htmlFor="blog-sort" className="sr-only">
            Saralash
          </label>
          <select
            id="blog-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Maqolalarni saralash"
          >
            <option value="newest">Eng yangi</option>
            <option value="popular">Eng ko‘p o‘qilgan</option>
          </select>
        </div>
      </div>

      <div className="blog-category-pills" role="group" aria-label="Kategoriya bo‘yicha filtrlash">
        <button
          type="button"
          className={!category ? 'is-active' : ''}
          onClick={() => onCategoryChange('')}
          aria-pressed={!category}
        >
          Barchasi {total > 0 && `(${total})`}
        </button>
        {BLOG_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={category === cat.key ? 'is-active' : ''}
            onClick={() => onCategoryChange(cat.key)}
            aria-pressed={category === cat.key}
            title={cat.description}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}

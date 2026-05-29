import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Skeleton from 'react-loading-skeleton'
import { selectCatalog, selectStoreCategories } from '../features/catalog/catalogSlice'
import '../assets/styles/category.scss'

const CATEGORY_ICONS = {
  sofas: 'fa-solid fa-couch',
  sectionals: 'fa-solid fa-couch',
  chairs: 'fa-solid fa-chair',
  beds: 'fa-solid fa-bed',
  dining: 'fa-solid fa-utensils',
  office: 'fa-solid fa-briefcase',
}

function iconForCategory(category) {
  const key = (category.slug || category.name || '').toLowerCase()
  return CATEGORY_ICONS[key] || 'fa-solid fa-couch'
}

function Category() {
  const carouselRef = useRef(null)
  const { loading } = useSelector(selectCatalog)
  const categories = useSelector(selectStoreCategories)

  const scrollLeft = () => {
    carouselRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  return (
    <div className="container">
      <div className="category">
        <div className="carousel-header">
          <div className="product-head">
            <h4 className="product-subtitle">
              <p />
              Categories
            </h4>

            <div className="product-row">
              <div className="product-left">
                <h2 className="product-title">Browse By Category</h2>
              </div>

              <div className="product-roles">
                <button type="button" onClick={scrollLeft}>
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <button type="button" onClick={scrollRight}>
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="category-row" ref={carouselRef}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="category-card">
                <Skeleton circle width={48} height={48} />
                <Skeleton width={80} />
              </div>
            ))
          ) : categories.length === 0 ? (
            <p className="text-sm text-[#545252] py-4">No categories available yet.</p>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id || category.slug}
                to={category.id ? `/category/${category.id}` : `/products?category=${category.slug}`}
                className="category-card"
              >
                <i className={iconForCategory(category)} aria-hidden />
                <p>{category.name}</p>
              </Link>
            ))
          )}
        </div>
        <div className="category-line" />
      </div>
    </div>
  )
}

export default Category

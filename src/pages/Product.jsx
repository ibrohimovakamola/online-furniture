import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import useFetch from '../hook/useFetch'
import ProductCard from '../components/ProductCard'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import BreadCrumbs from '../components/BreadCrumbs'
import {
  fetchStoreCategories,
  selectCategoryById,
} from '../features/catalog/catalogSlice'

const Product = () => {
  const dispatch = useDispatch()
  const { categoryId: routeCategoryId } = useParams()
  const [searchParams] = useSearchParams()
  const categoryId = routeCategoryId || searchParams.get('category') || ''

  const categoryMeta = useSelector(selectCategoryById(categoryId))

  useEffect(() => {
    if (categoryId) {
      dispatch(fetchStoreCategories())
    }
  }, [dispatch, categoryId])

  const { state, loading, error } = useFetch('products', {
    category: categoryId || undefined,
  })

  const products = state?.products ?? []
  const pageTitle = categoryMeta?.name
    ? `${categoryMeta.name}`
    : categoryId
      ? 'Category'
      : 'All Products'

  return (
    <div className="container">
      <BreadCrumbs currentName={categoryMeta?.name} />

      <h2 className="product-page-title" style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
        {pageTitle}
      </h2>

      {error && (
        <p style={{ color: 'crimson', marginBottom: 16 }} role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="product-page--cards">
          {Array(8)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="skeleton-card">
                <Skeleton className="skeleton-img" />
                <Skeleton className="skeleton-line" />
                <Skeleton className="skeleton-line short" />
              </div>
            ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-card extra" style={{ margin: '48px auto', maxWidth: 480 }}>
          <i className="fa-solid fa-box-open" />
          <p className="empty-text">
            {categoryId
              ? 'No products found in this category yet.'
              : 'No products available at the moment.'}
          </p>
          <Link to="/products" className="empty-btn">
            View all products
          </Link>
        </div>
      ) : (
        <div className="product-page--cards">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Product

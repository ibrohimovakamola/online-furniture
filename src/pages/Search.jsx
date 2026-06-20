import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import SearchBar from '../components/SearchBar'
import ProductCard from '../components/ProductCard'
import BreadCrumbs from '../components/BreadCrumbs'
import { searchProducts } from '../services/searchApi'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('query')?.trim() ?? ''

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(Boolean(query))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!query) {
      setProducts([])
      setLoading(false)
      setError(null)
      return undefined
    }

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const result = await searchProducts(query, { signal: controller.signal })
        setProducts(result.products)
      } catch (err) {
        if (err.name === 'AbortError') return
        setError(err.message || 'Could not load search results')
        setProducts([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [query])

  const handleSearch = (nextQuery) => {
    setSearchParams({ query: nextQuery })
  }

  return (
    <div className="container pb-16">
      <BreadCrumbs currentName={query ? `Search: ${query}` : 'Search'} />

      <div className="mx-auto mb-10 w-full max-w-3xl px-2">
        <SearchBar
          variant="page"
          initialQuery={query}
          className="w-full"
          inputClassName="w-full"
          onSearch={handleSearch}
        />
      </div>

      {!query ? (
        <div className="empty-card extra mx-auto max-w-lg text-center">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <p className="empty-text">Enter a keyword to find sofas, chairs, beds, and more.</p>
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-[Poppins] text-2xl font-semibold text-[#1a1a1a] md:text-[28px]">
                Search results
              </h1>
              <p className="mt-1 font-[Poppins] text-sm text-[#666]">
                {loading
                  ? `Searching for “${query}”…`
                  : error
                    ? 'Something went wrong'
                    : `${products.length} result${products.length === 1 ? '' : 's'} for “${query}”`}
              </p>
            </div>
            <Link
              to="/products"
              className="font-[Poppins] text-sm font-medium text-[#0b3c3c] underline-offset-2 hover:underline"
            >
              Browse all products
            </Link>
          </div>

          {error && (
            <p className="mb-6 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <div className="product-page--cards">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="skeleton-card">
                  <Skeleton className="skeleton-img" />
                  <Skeleton className="skeleton-line" />
                  <Skeleton className="skeleton-line short" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-card extra mx-auto max-w-lg text-center">
              <i className="fa-solid fa-box-open" aria-hidden="true" />
              <p className="empty-text">
                No products matched “{query}”. Try a different keyword or browse our catalog.
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
        </>
      )}
    </div>
  )
}

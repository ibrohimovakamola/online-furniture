import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Skeleton from 'react-loading-skeleton'
import useFetch from '../hook/useFetch'
import PremiumProductCard from './PremiumProductCard'
import Pagination from './Pagination'

const PAGE_SIZE = 8
const FETCH_LIMIT = 24

function sortBestSelling(products) {
  return [...products].sort((a, b) => {
    const discountDiff = (b.discountPercentage || 0) - (a.discountPercentage || 0)
    if (discountDiff !== 0) return discountDiff
    return (b.basePrice || b.price || 0) - (a.basePrice || a.price || 0)
  })
}

function BestSellingProducts() {
  const sectionRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { state, loading, error } = useFetch('products', { limit: FETCH_LIMIT })

  const sortedProducts = useMemo(() => {
    const list = state?.products ?? []
    return sortBestSelling(list)
  }, [state?.products])

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE))

  const products = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedProducts.slice(start, start + PAGE_SIZE)
  }, [sortedProducts, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [sortedProducts.length])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <section ref={sectionRef} className="py-10 md:py-14">
      <div className="container mx-auto max-w-[1360px] px-3">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4">
            <h4 className="flex items-center gap-4 font-[Poppins] text-base font-semibold text-[#0b3c3c]">
              <span className="block h-10 w-5 shrink-0 rounded bg-[#0b3c3c]" aria-hidden />
              This Month
            </h4>
            <h2 className="font-[Inter] text-3xl font-semibold tracking-wide text-[#0b3c3c] md:text-4xl">
              Best Selling Products
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded border border-[#0b3c3c] px-8 py-3 font-[Poppins] text-sm font-medium text-[#0b3c3c] transition hover:bg-[#0b3c3c] hover:text-white"
          >
            View All Products
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[4/5] w-full rounded-lg" />
                <Skeleton height={18} width="80%" />
                <Skeleton height={16} width="40%" />
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#0b3c3c]/30 bg-[#f8fafa] px-6 py-16 text-center">
            <p className="font-[Poppins] text-[#545252]">No products available yet. Check back soon.</p>
            <Link
              to="/products"
              className="mt-4 inline-block font-[Poppins] text-sm font-semibold text-[#0b3c3c] underline underline-offset-4"
            >
              Browse catalog
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <PremiumProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination
              className="mt-10"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              prevLabel="Previous"
              nextLabel="Next"
              ariaLabel="Best selling products pagination"
            />
          </>
        )}

        <div className="mt-12 h-px w-full bg-[#0b3c3c]/15" />
      </div>
    </section>
  )
}

export default BestSellingProducts

import { ChevronLeft, ChevronRight } from 'lucide-react'

const DEFAULT_SIBLING_COUNT = 1

/**
 * Build a compact page list with ellipsis for large page counts.
 * @returns {(number | 'ellipsis')[]
 */
function buildPageRange(currentPage, totalPages, siblingCount = DEFAULT_SIBLING_COUNT) {
  if (totalPages <= 1) return [1]

  const totalNumbers = siblingCount * 2 + 5
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < totalPages - 1

  const range = []

  range.push(1)

  if (showLeftEllipsis) {
    range.push('ellipsis')
  } else {
    for (let page = 2; page < leftSibling; page += 1) {
      range.push(page)
    }
  }

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    if (page !== 1 && page !== totalPages) {
      range.push(page)
    }
  }

  if (showRightEllipsis) {
    range.push('ellipsis')
  } else {
    for (let page = rightSibling + 1; page < totalPages; page += 1) {
      range.push(page)
    }
  }

  if (totalPages > 1) {
    range.push(totalPages)
  }

  return range
}

const baseButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded border font-[Poppins] text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3c3c]'

const navButtonClass = `${baseButtonClass} gap-1.5 border-[#0b3c3c] px-4 py-2 text-[#0b3c3c] hover:bg-[#0b3c3c] hover:text-white disabled:pointer-events-none disabled:border-[#0b3c3c]/25 disabled:text-[#0b3c3c]/40 disabled:hover:bg-transparent`

const pageButtonClass = `${baseButtonClass} min-w-10 px-3 py-2`

/**
 * Reusable pagination control with Previous / Next and numbered pages.
 *
 * @param {{
 *   currentPage: number
 *   totalPages: number
 *   onPageChange: (page: number) => void
 *   className?: string
 *   prevLabel?: string
 *   nextLabel?: string
 *   ariaLabel?: string
 * }} props
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  prevLabel = 'Previous',
  nextLabel = 'Next',
  ariaLabel = 'Pagination',
}) {
  if (totalPages <= 1) return null

  const safePage = Math.min(Math.max(currentPage, 1), totalPages)
  const pages = buildPageRange(safePage, totalPages)
  const isFirstPage = safePage <= 1
  const isLastPage = safePage >= totalPages

  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-2 ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={navButtonClass}
        onClick={() => onPageChange(safePage - 1)}
        disabled={isFirstPage}
        aria-label={`${prevLabel}, page ${safePage - 1}`}
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        {prevLabel}
      </button>

      <ul className="flex flex-wrap items-center justify-center gap-2" role="list">
        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <li key={`ellipsis-${index}`} aria-hidden>
              <span className="inline-flex min-h-10 min-w-10 items-center justify-center font-[Poppins] text-sm text-[#545252]">
                …
              </span>
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={
                  item === safePage
                    ? `${pageButtonClass} border-[#0b3c3c] bg-[#0b3c3c] text-white`
                    : `${pageButtonClass} border-[#0b3c3c]/30 text-[#0b3c3c] hover:border-[#0b3c3c] hover:bg-[#0b3c3c] hover:text-white`
                }
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === safePage ? 'page' : undefined}
              >
                {item}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        className={navButtonClass}
        onClick={() => onPageChange(safePage + 1)}
        disabled={isLastPage}
        aria-label={`${nextLabel}, page ${safePage + 1}`}
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
      </button>
    </nav>
  )
}

export default Pagination

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import useDebouncedValue from '../hook/useDebouncedValue'
import { fetchSearchSuggestions } from '../services/searchApi'
import { resolveProductImageUrl } from '../utils/productImage'

function SearchIcon({ className = '' }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20L16.65 16.65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SuggestionThumb({ src, name }) {
  const [failed, setFailed] = useState(false)
  const resolved = resolveProductImageUrl(src)

  if (!resolved || failed) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#f3f4f6] text-[#0b3c3c]/40">
        <SearchIcon className="h-4 w-4" />
      </div>
    )
  }

  return (
    <img
      src={resolved}
      alt=""
      className="h-12 w-12 shrink-0 rounded object-cover bg-[#f3f4f6]"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function SearchSuggestionsDropdown({
  listId,
  query,
  suggestions,
  loading,
  onSelect,
  onViewAll,
}) {
  const trimmed = query.trim()
  const showEmpty = !loading && suggestions.length === 0

  return (
    <div
      id={listId}
      role="listbox"
      aria-label="Product suggestions"
      className="absolute left-0 right-0 top-[calc(100%+6px)] overflow-hidden rounded border-2 border-[#0b3c3c] bg-white shadow-[0_20px_48px_rgba(11,60,60,0.18)]"
    >
      {loading && (
        <div className="px-5 py-4 font-[Poppins] text-sm text-[#666]">Searching…</div>
      )}

      {!loading && suggestions.length > 0 && (
        <ul className="max-h-[min(360px,50vh)] overflow-y-auto py-1">
          {suggestions.map((item) => (
            <li key={item.id} role="option">
              <button
                type="button"
                className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#0b3c3c]/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(item.id)}
              >
                <SuggestionThumb src={item.image} name={item.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-[Poppins] text-sm font-semibold uppercase tracking-wide text-[#1a1a1a]">
                    {item.name}
                  </span>
                  {item.category && (
                    <span className="mt-0.5 block truncate font-[Poppins] text-xs text-[#666]">
                      {item.category}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <div className="px-5 py-4 font-[Poppins] text-sm text-[#666]">
          No products found for “{trimmed}”.
        </div>
      )}

      <div className="border-t border-[#0b3c3c]/15 bg-[#fafafa]">
        <button
          type="button"
          className="w-full px-5 py-3 text-left font-[Poppins] text-sm font-medium text-[#0b3c3c] transition-colors hover:bg-[#0b3c3c]/5"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onViewAll}
        >
          View all results for &lsquo;{trimmed}&rsquo;
        </button>
      </div>
    </div>
  )
}

/**
 * Premium search bar with live suggestions, backdrop blur, and expanded active state.
 */
export default function SearchBar({
  initialQuery = '',
  className = '',
  inputClassName = '',
  variant = 'header',
  onSearch,
}) {
  const navigate = useNavigate()
  const listId = useId()
  const inputId = useId()
  const containerRef = useRef(null)

  const [query, setQuery] = useState(initialQuery)
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const trimmedQuery = query.trim()
  const isActive = focused && trimmedQuery.length > 0
  const showDropdown = isActive && (loading || trimmedQuery.length > 0)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const closePanel = useCallback(() => {
    setFocused(false)
  }, [])

  const goToSearch = useCallback(
    (term) => {
      const value = String(term || '').trim()
      if (!value) return

      closePanel()
      if (onSearch) {
        onSearch(value)
        return
      }
      navigate(`/search?query=${encodeURIComponent(value)}`)
    },
    [closePanel, navigate, onSearch]
  )

  const goToProduct = useCallback(
    (productId) => {
      closePanel()
      navigate(`/products/${productId}`)
    },
    [closePanel, navigate]
  )

  useEffect(() => {
    if (!focused) return undefined

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        closePanel()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [focused, closePanel])

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([])
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()

    async function loadSuggestions() {
      setLoading(true)
      try {
        const result = await fetchSearchSuggestions(debouncedQuery, {
          limit: 5,
          signal: controller.signal,
        })
        setSuggestions(result.suggestions)
      } catch (err) {
        if (err.name === 'AbortError') return
        setSuggestions([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadSuggestions()
    return () => controller.abort()
  }, [debouncedQuery])

  useEffect(() => {
    if (!isActive) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isActive, closePanel])

  const handleSubmit = (e) => {
    e.preventDefault()
    goToSearch(trimmedQuery)
  }

  const widthClass =
    variant === 'page'
      ? 'w-full max-w-3xl'
      : isActive
        ? 'w-full max-w-3xl'
        : 'w-full max-w-xl'

  const positionClass =
    variant === 'header' && isActive
      ? 'fixed left-1/2 top-[7.25rem] z-[310] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 sm:top-[7.75rem]'
      : 'relative'

  return (
    <>
      {variant === 'header' && isActive &&
        createPortal(
          <button
            type="button"
            className="fixed inset-0 z-[300] bg-black/25 backdrop-blur-md"
            aria-label="Close search"
            onClick={closePanel}
          />,
          document.body
        )}

      <div ref={containerRef} className={`${positionClass} ${widthClass} ${className}`}>
        <form
          onSubmit={handleSubmit}
          className="relative z-[1] flex items-stretch overflow-hidden rounded border-2 border-[#0b3c3c] bg-white shadow-sm"
          role="search"
        >
        <label htmlFor={inputId} className="sr-only">
          Search products
        </label>
        <input
          id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="What are you looking for?"
            className={`min-w-0 flex-1 border-none bg-transparent px-5 py-3 font-[Poppins] text-sm leading-[18px] text-[#1a1a1a] outline-none placeholder:text-[#9ca3af] md:text-base ${inputClassName}`}
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listId : undefined}
            aria-autocomplete="list"
          />
          <button
            type="submit"
            className="flex shrink-0 items-center justify-center bg-[#0b3c3c] px-4 text-white transition-colors hover:bg-[#0a3333] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3c3c]"
            aria-label="Search"
          >
            <SearchIcon />
          </button>
        </form>

        {showDropdown && (
          <SearchSuggestionsDropdown
            listId={listId}
            query={trimmedQuery}
            suggestions={suggestions}
            loading={loading}
            onSelect={goToProduct}
            onViewAll={() => goToSearch(trimmedQuery)}
          />
        )}
      </div>
    </>
  )
}

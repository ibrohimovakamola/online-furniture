import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import { resolveProductImageUrl } from '../utils/imageUrl'

const SIZES = {
  sm: 'h-12 w-12',
  md: 'h-14 w-14',
  lg: 'h-16 w-16',
}

function ProductThumbnail({ src, alt = '', size = 'md', className = '' }) {
  const resolvedSrc = resolveProductImageUrl(src)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [resolvedSrc])

  const sizeClass = SIZES[size] ?? SIZES.md
  const showFallback = !resolvedSrc || failed

  if (showFallback) {
    return (
      <div
        className={`${sizeClass} shrink-0 flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-gradient-to-br from-[var(--admin-bg-elevated)] to-[var(--admin-surface)] ${className}`}
        role="img"
        aria-label={alt ? `${alt} — no image` : 'No product image'}
      >
        <Package
          className="h-5 w-5 text-[var(--admin-accent)] opacity-70"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] ${className}`}
    >
      <img
        src={resolvedSrc}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

export default ProductThumbnail

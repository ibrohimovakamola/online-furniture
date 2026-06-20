import { ExternalLink } from 'lucide-react'

/**
 * Single Instagram post — iframe embed with optional official HTML override.
 */
export default function InstagramPostCard({ post }) {
  const { embedSrc, permalink, postId, thumbnailPlaceholder, embedHtml } = post

  if (embedHtml) {
    return (
      <div
        className="instagram-embed-html w-full overflow-hidden rounded-2xl bg-white ring-1 ring-[#0b3c3c]/10"
        dangerouslySetInnerHTML={{ __html: embedHtml }}
      />
    )
  }

  return (
    <article className="relative w-full overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_-12px_rgba(11,60,60,0.2)] ring-1 ring-[#0b3c3c]/10">
      {/* Placeholder layer (visible behind slow-loading or blocked iframes) */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: thumbnailPlaceholder || '#f4f7f7' }}
        aria-hidden
      />

      <div className="relative z-10 aspect-[9/16] w-full bg-[#fafafa]">
        <iframe
          src={embedSrc}
          title={`Instagram post ${postId} — @kresla.uz`}
          className="absolute inset-0 h-full w-full border-0"
          frameBorder="0"
          scrolling="no"
          allowTransparency
          allow="encrypted-media; autoplay; clipboard-write; fullscreen"
          loading="lazy"
        />
      </div>

      <a
        href={permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#0b3c3c]/90 text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 hover:bg-[#0d4a4a]"
        aria-label="Open on Instagram"
      >
        <ExternalLink className="h-4 w-4" strokeWidth={2} />
      </a>
    </article>
  )
}

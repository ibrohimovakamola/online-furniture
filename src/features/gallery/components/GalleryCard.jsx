import { GALLERY_CATEGORY_LABELS } from '../constants'

export default function GalleryCard({ item }) {
  const categoryLabel = GALLERY_CATEGORY_LABELS[item.category] || item.category

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_-12px_rgba(11,60,60,0.25)] ring-1 ring-[#0b3c3c]/8 transition-shadow duration-300 hover:shadow-[0_16px_40px_-12px_rgba(11,60,60,0.3)]">
      <div className="aspect-[4/3] overflow-hidden bg-[#f5f5f5]">
        <img
          src={item.image?.url}
          alt={item.image?.alt || item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>

      <div className="flex flex-col gap-1 p-4 sm:p-5">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0b3c3c]/70">
          {categoryLabel}
        </span>
        <h3 className="font-[Poppins] text-base font-semibold text-[#1a1a1a]">{item.title}</h3>
        {item.description ? (
          <p className="line-clamp-2 text-sm text-[#6b6b6b]">{item.description}</p>
        ) : null}
      </div>
    </article>
  )
}

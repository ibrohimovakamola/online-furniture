/** Category metadata — colors, labels, short descriptions */
export const BLOG_CATEGORIES = [
  {
    key: 'Maslahat',
    label: 'Maslahat',
    description: 'Amaliy maslahatlar va interyer bo‘yicha yo‘riqnomalar.',
    badgeClass: 'blog-badge--tips',
    cover: '#c8e6d9',
  },
  {
    key: 'Trend',
    label: 'Trend',
    description: 'So‘nggi mebel va dizayn trendlari haqida yangiliklar.',
    badgeClass: 'blog-badge--trend',
    cover: '#d4e4f0',
  },
  {
    key: "Qo'llanma",
    label: "Qo'llanma",
    description: 'Batafsil qo‘llanmalar, taqqoslashlar va tanlov yordami.',
    badgeClass: 'blog-badge--guide',
    cover: '#f0e6d4',
  },
  {
    key: 'Dizayn',
    label: 'Dizayn',
    description: 'Interyer dizayn g‘oyalari va ilhom manbalari.',
    badgeClass: 'blog-badge--design',
    cover: '#e8d4f0',
  },
]

export const BLOG_CATEGORY_MAP = Object.fromEntries(
  BLOG_CATEGORIES.map((c) => [c.key, c])
)

export const BLOG_PAGE_SIZE = 6

export function getCategoryMeta(category) {
  return (
    BLOG_CATEGORY_MAP[category] || {
      key: category,
      label: category,
      description: '',
      badgeClass: 'blog-badge--default',
      cover: '#dce8f0',
    }
  )
}

import { Link } from 'react-router-dom'
import { Edit, ExternalLink, Trash2 } from 'lucide-react'
import { getCategoryMeta } from '@/features/blog/constants'

const STATUS_STYLES = {
  draft: 'admin-badge--pending',
  published: 'admin-badge--success',
  scheduled: 'admin-badge--shipping',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function BlogPostTable({
  posts,
  selected,
  onToggle,
  onToggleAll,
  onStatusChange,
  onDelete,
}) {
  const allSelected = posts.length > 0 && posts.every((p) => selected.has(p.id))

  return (
    <div className="admin-table-wrap overflow-x-auto">
      <table className="admin-table w-full min-w-[720px]">
        <thead>
          <tr>
            <th className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
                aria-label="Select all posts"
              />
            </th>
            <th>Title</th>
            <th>Category</th>
            <th>Author</th>
            <th>Published</th>
            <th>Status</th>
            <th>Views</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const cat = getCategoryMeta(post.category)
            return (
              <tr key={post.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(post.id)}
                    onChange={() => onToggle(post.id)}
                    aria-label={`Select ${post.title}`}
                  />
                </td>
                <td>
                  <p className="font-medium text-[var(--admin-text)] line-clamp-2">{post.title}</p>
                  <p className="text-xs text-[var(--admin-text-subtle)] mt-0.5">/{post.slug}</p>
                </td>
                <td>
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{ background: `${cat.cover}99`, color: cat.color || '#0b3c3c' }}
                  >
                    {post.category}
                  </span>
                </td>
                <td className="text-sm">{post.author}</td>
                <td className="text-sm whitespace-nowrap">{formatDate(post.publishedAt || post.createdAt)}</td>
                <td>
                  <select
                    value={post.status}
                    onChange={(e) => onStatusChange(post.id, e.target.value)}
                    className={`admin-badge appearance-none pr-6 cursor-pointer border-0 text-xs ${STATUS_STYLES[post.status] || ''}`}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </td>
                <td className="text-sm tabular-nums">{post.viewCount ?? 0}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    {post.status === 'published' && (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn admin-btn--ghost admin-btn--icon"
                        aria-label="Preview"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Link
                      to={`/admin/blog/edit/${post.id}`}
                      className="admin-btn admin-btn--ghost admin-btn--icon"
                      aria-label="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--icon text-[var(--admin-danger)]"
                      onClick={() => onDelete(post)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

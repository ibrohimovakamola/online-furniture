function AdminPageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="admin-page-title">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--admin-text-muted)] mt-1">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export default AdminPageHeader

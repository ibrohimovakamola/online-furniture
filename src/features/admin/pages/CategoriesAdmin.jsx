import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Plus, Filter, Pencil, Trash2 } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import CategoryFormModal from '../component/CategoryFormModal'
import ConfirmDialog from '../component/ConfirmDialog'
import LoadingSpinner from '../component/LoadingSpinner'
import { useAdminSearch, useDebouncedValue } from '../context/AdminSearchContext'
import { filterByDateRange, matchesSearch } from '../utils/dateFilter'
import {
  selectAdmin,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../store/adminSlice'

function CategoriesAdmin() {
  const dispatch = useDispatch()
  const { searchQuery, dateRange } = useAdminSearch()
  const debouncedSearch = useDebouncedValue(searchQuery)
  const { categories, loading } = useSelector(selectAdmin)

  const filteredCategories = useMemo(() => {
    let list = filterByDateRange(categories, dateRange)
    return list.filter((c) => matchesSearch(c, searchQuery, ['name', 'slug']))
  }, [categories, dateRange, searchQuery])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    dispatch(fetchCategories(debouncedSearch))
  }, [dispatch, debouncedSearch])

  const handleCreate = async ({ payload, imageFile }) => {
    const result = await dispatch(createCategory({ payload, imageFile }))
    if (createCategory.fulfilled.match(result)) {
      toast.success('Category created')
      setModalOpen(false)
      dispatch(fetchCategories(''))
    } else {
      toast.error(result.payload || 'Failed to create category')
    }
  }

  const handleUpdate = async ({ payload, imageFile }) => {
    const result = await dispatch(updateCategory({ id: editingCategory.id, payload, imageFile }))
    if (updateCategory.fulfilled.match(result)) {
      toast.success('Category updated')
      setModalOpen(false)
      setEditingCategory(null)
    } else {
      toast.error(result.payload || 'Failed to update category')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await dispatch(deleteCategory(deleteTarget.id))
    if (deleteCategory.fulfilled.match(result)) {
      toast.success('Category deleted')
      setDeleteTarget(null)
    } else {
      toast.error(result.payload || 'Failed to delete category')
    }
  }

  return (
    <div>
      <AdminPageHeader title="Categories" subtitle="Kategoriyalar — sofas, sectionals, chairs, beds">
        <button type="button" className="admin-btn admin-btn--ghost">
          <Filter className="h-4 w-4" />
          Filter
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => { setEditingCategory(null); setModalOpen(true) }}
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </AdminPageHeader>

      {loading.categories ? (
        <LoadingSpinner label="Loading categories…" fullScreen />
      ) : !filteredCategories?.length ? (
        <div className="admin-card py-16 text-center text-[var(--admin-text-muted)]">
          {categories?.length
            ? 'No categories match your search or date filter.'
            : 'No categories yet. Click "Add Category" to create one.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="admin-card overflow-hidden group hover:-translate-y-0.5 transition-transform duration-200">
              <div className="admin-image-slot h-40 w-full rounded-none border-0 border-b border-[var(--admin-border)]">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} />
                ) : (
                  <span className="text-[var(--admin-text-subtle)] text-sm">Category image</span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[var(--admin-text)]">{cat.name}</h3>
                    <p className="text-sm text-[var(--admin-text-muted)] mt-1">
                      {cat.productCount} products
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className="admin-btn admin-btn--ghost admin-btn--icon" onClick={() => { setEditingCategory(cat); setModalOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" className="admin-btn admin-btn--danger admin-btn--icon" onClick={() => setDeleteTarget(cat)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCategory(null) }}
        onSubmit={editingCategory ? handleUpdate : handleCreate}
        initialData={editingCategory}
        loading={loading.action}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Categories with products cannot be removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={loading.action}
      />
    </div>
  )
}

export default CategoriesAdmin

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Plus, Filter } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import ProductTable from '../component/ProductTable'
import ProductFormModal from '../component/ProductFormModal'
import ConfirmDialog from '../component/ConfirmDialog'
import LoadingSpinner from '../component/LoadingSpinner'
import { useAdminSearch } from '../context/AdminSearchContext'
import {
  selectAdmin,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../store/adminSlice'

function ProductsAdmin() {
  const dispatch = useDispatch()
  const { searchQuery } = useAdminSearch()
  const searchTerm = searchQuery
  const { products, categories, loading } = useSelector(selectAdmin)

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return list
    return list.filter(
      (p) =>
        (p.name ?? p.title ?? '').toLowerCase().includes(term) ||
        (p.sku ?? '').toLowerCase().includes(term)
    )
  }, [products, searchTerm])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    dispatch(fetchCategories(''))
  }, [dispatch])

  const handleCreate = async ({ payload, files }) => {
    const result = await dispatch(createProduct({ payload, files }))
    if (createProduct.fulfilled.match(result)) {
      toast.success('Product created successfully')
      setModalOpen(false)
    } else {
      toast.error(result.payload || 'Failed to create product')
    }
  }

  const handleUpdate = async ({ payload, files }) => {
    const id = editingProduct.id || editingProduct._id
    const result = await dispatch(updateProduct({ id, payload, files }))
    if (updateProduct.fulfilled.match(result)) {
      toast.success('Product updated successfully')
      setModalOpen(false)
      setEditingProduct(null)
    } else {
      toast.error(result.payload || 'Failed to update product')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const id = deleteTarget.id || deleteTarget._id
    const result = await dispatch(deleteProduct(id))
    if (deleteProduct.fulfilled.match(result)) {
      toast.success('Product deleted')
      setDeleteTarget(null)
    } else {
      toast.error(result.payload || 'Failed to delete product')
    }
  }

  return (
    <div>
      <AdminPageHeader title="Products" subtitle="Mebel mahsulotlari boshqaruvi">
        <button type="button" className="admin-btn admin-btn--ghost">
          <Filter className="h-4 w-4" />
          Filter
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => { setEditingProduct(null); setModalOpen(true) }}
        >
          <Plus className="h-4 w-4" />
          Add New
        </button>
      </AdminPageHeader>

      <div className="admin-card p-2 sm:p-4">
        {loading.products ? (
          <LoadingSpinner label="Loading products…" />
        ) : !filteredProducts?.length ? (
          <p className="py-16 text-center text-[var(--admin-text-muted)]">
            {products?.length
              ? 'No products match your search or date filter.'
              : 'No products yet. Click "Add New" to create your first product.'}
          </p>
        ) : (
          <ProductTable
            products={filteredProducts}
            onEdit={(product) => { setEditingProduct(product); setModalOpen(true) }}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null) }}
        onSubmit={editingProduct ? handleUpdate : handleCreate}
        categories={categories}
        initialData={editingProduct}
        loading={loading.action}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={loading.action}
      />
    </div>
  )
}

export default ProductsAdmin

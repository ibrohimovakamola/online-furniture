import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Plus, Filter } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import ProductTable from '../component/ProductTable'
import ProductFormModal from '../component/ProductFormModal'
import ProductFilterPanel from '../component/ProductFilterPanel'
import ConfirmDialog from '../component/ConfirmDialog'
import LoadingSpinner from '../component/LoadingSpinner'
import { useAdminSearch } from '../context/AdminSearchContext'
import {
  selectAdmin,
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../store/adminSlice'

function ProductsAdmin() {
  const dispatch = useDispatch()
  const { productFilters, setProductFilters, searchQuery, dateRange } = useAdminSearch()
  const { products, categories, loading } = useSelector(selectAdmin)

  const tableProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  )

  const [filterOpen, setFilterOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (productFilters.category) count += 1
    if (productFilters.stockStatus !== 'all') count += 1
    if (productFilters.minPrice !== '') count += 1
    if (productFilters.maxPrice !== '') count += 1
    return count
  }, [productFilters])

  const handleApplyFilters = (next) => {
    setProductFilters(next)
    toast.success('Filters applied')
  }

  const refetchProducts = () =>
    dispatch(
      fetchProducts({
        search: searchQuery,
        dateRange,
        category: productFilters.category,
        stockStatus: productFilters.stockStatus,
        minPrice: productFilters.minPrice,
        maxPrice: productFilters.maxPrice,
      })
    )

  const handleCreate = async ({ payload, files }) => {
    const result = await dispatch(createProduct({ payload, files }))
    if (createProduct.fulfilled.match(result)) {
      toast.success('Product created successfully')
      setModalOpen(false)
      setEditingProduct(null)
      dispatch(fetchCategories(''))
      refetchProducts()
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
      refetchProducts()
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
        <div className="relative">
          <button
            type="button"
            className={`admin-btn admin-btn--ghost ${activeFilterCount ? 'ring-1 ring-[#5eead4]/50' : ''}`}
            onClick={() => setFilterOpen((v) => !v)}
            aria-expanded={filterOpen}
          >
            <Filter className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#5eead4] text-[10px] font-bold text-[#0b3c3c] inline-flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <ProductFilterPanel
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            categories={categories}
            appliedFilters={productFilters}
            onApply={handleApplyFilters}
          />
        </div>
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
        ) : !tableProducts.length ? (
          <p className="py-16 text-center text-[var(--admin-text-muted)]">
            {activeFilterCount
              ? 'No products match your filters. Try adjusting or clearing them.'
              : 'No products yet. Click "Add New" to create your first product.'}
          </p>
        ) : (
          <ProductTable
            products={tableProducts}
            onEdit={(product) => { setEditingProduct(product); setModalOpen(true) }}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <ProductFormModal
        key={editingProduct?.id || editingProduct?._id || 'new'}
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

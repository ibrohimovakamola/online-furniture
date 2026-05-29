import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Calendar, Percent, Save, ToggleLeft, ToggleRight, Zap } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import LoadingSpinner from '../component/LoadingSpinner'
import {
  fetchFlashSale,
  saveFlashSaleConfig,
  saveFlashSaleProducts,
  selectAdmin,
} from '../store/adminSlice'

function toDatetimeLocalValue(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function FlashSaleAdmin() {
  const dispatch = useDispatch()
  const { flashSale, loading } = useSelector(selectAdmin)
  const [config, setConfig] = useState({
    enabled: false,
    showOnHomepage: true,
    endsAt: '',
    title: 'Flash Sales',
  })
  const [selections, setSelections] = useState({})

  useEffect(() => {
    dispatch(fetchFlashSale())
  }, [dispatch])

  useEffect(() => {
    if (!flashSale.config) return
    setConfig({
      enabled: flashSale.config.enabled,
      showOnHomepage: flashSale.config.showOnHomepage,
      endsAt: toDatetimeLocalValue(flashSale.config.endsAt),
      title: flashSale.config.title || 'Flash Sales',
    })
  }, [flashSale.config])

  useEffect(() => {
    const map = {}
    flashSale.products?.forEach((p) => {
      const id = p.id || p._id
      map[id] = {
        id,
        isFlashSale: Boolean(p.isFlashSale),
        flashSaleDiscountPercent: p.flashSaleDiscountPercent || 0,
      }
    })
    setSelections(map)
  }, [flashSale.products])

  const flashProducts = useMemo(
    () => Object.values(selections).filter((s) => s.isFlashSale),
    [selections]
  )

  const handleSaveConfig = async () => {
    const result = await dispatch(
      saveFlashSaleConfig({
        enabled: config.enabled,
        showOnHomepage: config.showOnHomepage,
        endsAt: config.endsAt ? new Date(config.endsAt).toISOString() : null,
        title: config.title,
      })
    )
    if (saveFlashSaleConfig.fulfilled.match(result)) {
      toast.success('Flash sale settings saved')
    } else {
      toast.error(result.payload || 'Failed to save settings')
    }
  }

  const handleSaveProducts = async () => {
    const products = Object.values(selections).map((s) => ({
      id: s.id,
      isFlashSale: s.isFlashSale,
      flashSaleDiscountPercent: Number(s.flashSaleDiscountPercent) || 0,
    }))
    const result = await dispatch(saveFlashSaleProducts(products))
    if (saveFlashSaleProducts.fulfilled.match(result)) {
      toast.success('Flash sale products updated')
    } else {
      toast.error(result.payload || 'Failed to update products')
    }
  }

  const updateSelection = (id, patch) => {
    setSelections((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  if (loading.flashSale && !flashSale.products?.length) {
    return <LoadingSpinner label="Loading flash sale…" />
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Flash Sale"
        subtitle="Countdown, discounts, and homepage banner visibility"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-card p-6 space-y-5">
          <div className="flex items-center gap-2 text-[var(--admin-text)]">
            <Zap className="h-5 w-5 text-[#5eead4]" />
            <h3 className="font-semibold">Campaign settings</h3>
          </div>

          <label className="admin-field">
            <span>Campaign title</span>
            <input
              type="text"
              className="admin-input"
              value={config.title}
              onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
            />
          </label>

          <label className="admin-field">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Countdown end date & time
            </span>
            <input
              type="datetime-local"
              className="admin-input"
              value={config.endsAt}
              onChange={(e) => setConfig((c) => ({ ...c, endsAt: e.target.value }))}
            />
          </label>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              className={`admin-toggle-row ${config.enabled ? 'is-on' : ''}`}
              onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
            >
              {config.enabled ? (
                <ToggleRight className="h-6 w-6 text-[#5eead4]" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-[var(--admin-text-muted)]" />
              )}
              <span>Flash sale active</span>
            </button>

            <button
              type="button"
              className={`admin-toggle-row ${config.showOnHomepage ? 'is-on' : ''}`}
              onClick={() => setConfig((c) => ({ ...c, showOnHomepage: !c.showOnHomepage }))}
            >
              {config.showOnHomepage ? (
                <ToggleRight className="h-6 w-6 text-[#5eead4]" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-[var(--admin-text-muted)]" />
              )}
              <span>Show banner on homepage</span>
            </button>
          </div>

          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleSaveConfig}
            disabled={loading.action}
          >
            <Save className="h-4 w-4" />
            Save campaign
          </button>
        </div>

        <div className="admin-card p-6">
          <h3 className="font-semibold text-[var(--admin-text)] mb-2">Preview</h3>
          <p className="text-sm text-[var(--admin-text-muted)] mb-4">
            {flashProducts.length} product(s) in flash sale
            {config.endsAt ? ` · ends ${new Date(config.endsAt).toLocaleString()}` : ''}
          </p>
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-hover)] p-4">
            <p className="text-xs uppercase tracking-wider text-[#5eead4]">Today&apos;s</p>
            <p className="text-xl font-semibold text-[var(--admin-text)] mt-1">{config.title}</p>
            <p className="text-sm text-[var(--admin-text-muted)] mt-2">
              Homepage section: {config.showOnHomepage && config.enabled ? 'Visible' : 'Hidden'}
            </p>
          </div>
        </div>
      </div>

      <div className="admin-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-[var(--admin-text)]">Product discounts</h3>
            <p className="text-sm text-[var(--admin-text-muted)]">
              Select products and set a flash discount percentage
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary shrink-0"
            onClick={handleSaveProducts}
            disabled={loading.action}
          >
            <Save className="h-4 w-4" />
            Save products
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)]">
                <th className="text-left py-3 px-4 text-[var(--admin-text-muted)]">Product</th>
                <th className="text-left py-3 px-4 text-[var(--admin-text-muted)]">Base price</th>
                <th className="text-left py-3 px-4 text-[var(--admin-text-muted)]">Flash %</th>
                <th className="text-left py-3 px-4 text-[var(--admin-text-muted)]">Sale price</th>
                <th className="text-center py-3 px-4 text-[var(--admin-text-muted)]">In sale</th>
              </tr>
            </thead>
            <tbody>
              {flashSale.products?.map((p) => {
                const id = p.id || p._id
                const sel = selections[id] || { isFlashSale: false, flashSaleDiscountPercent: 0 }
                const pct = Number(sel.flashSaleDiscountPercent) || 0
                const salePrice = p.basePrice
                  ? Math.round(p.basePrice * (1 - pct / 100) * 100) / 100
                  : '—'

                return (
                  <tr
                    key={id}
                    className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-surface-hover)]"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.thumbnail || p.mainImage ? (
                          <img
                            src={p.thumbnail || p.mainImage}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover bg-[var(--admin-surface-hover)]"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-[var(--admin-surface-hover)]" />
                        )}
                        <span className="font-medium text-[var(--admin-text)]">{p.name || p.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--admin-text-muted)]">${p.basePrice}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 max-w-[120px]">
                        <Percent className="h-3.5 w-3.5 text-[var(--admin-text-muted)]" />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="admin-input w-20 py-1"
                          value={sel.flashSaleDiscountPercent}
                          disabled={!sel.isFlashSale}
                          onChange={(e) =>
                            updateSelection(id, {
                              flashSaleDiscountPercent: e.target.value,
                            })
                          }
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#5eead4]">
                      {sel.isFlashSale ? `$${salePrice}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#5eead4]"
                        checked={sel.isFlashSale}
                        onChange={(e) =>
                          updateSelection(id, { isFlashSale: e.target.checked })
                        }
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default FlashSaleAdmin

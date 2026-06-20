import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Store, Image, Truck, Lock, Save } from 'lucide-react'
import AdminPageHeader from '../component/AdminPageHeader'
import LoadingSpinner from '../component/LoadingSpinner'
import {
  fetchAdminSettings,
  updateStoreSettings,
  updateBannerSettings,
  updateShippingSettings,
  changePassword,
  selectSettings,
  selectSettingsLoading,
} from '../../settings/settingsSlice'

function SettingsCard({ icon, title, subtitle, children, onSave, saving }) {
  const CardIcon = icon
  return (
    <section className="admin-card p-6 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)] text-[#5eead4]">
          <CardIcon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--admin-text-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
      {onSave && (
        <button type="button" className="admin-btn admin-btn--primary self-start" onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      )}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--admin-text-muted)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function SettingsAdmin() {
  const dispatch = useDispatch()
  const settings = useSelector(selectSettings)
  const loading = useSelector(selectSettingsLoading)
  const saving = useSelector((s) => s.settings.saving)

  const [store, setStore] = useState({ supportPhone: '', storeEmail: '', address: '', telegram: '', instagram: '' })
  const [banner, setBanner] = useState({ eyebrow: '', title: '', discountPercent: 10, ctaText: '', ctaLink: '/products' })
  const [shipping, setShipping] = useState({ defaultShippingFee: 0, freeShippingThreshold: 500 })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const bannerInputRef = useRef(null)

  useEffect(() => { dispatch(fetchAdminSettings()) }, [dispatch])

  useEffect(() => {
    if (!settings) return
    setStore({ ...settings.store })
    setBanner({
      eyebrow: settings.banner?.eyebrow || '',
      title: settings.banner?.title || '',
      discountPercent: settings.banner?.discountPercent ?? 10,
      ctaText: settings.banner?.ctaText || '',
      ctaLink: settings.banner?.ctaLink || '/products',
    })
    setShipping({ ...settings.shipping })
    setBannerPreview(settings.banner?.backgroundImageUrl || null)
  }, [settings])

  const saveStore = async () => {
    const result = await dispatch(updateStoreSettings(store))
    if (updateStoreSettings.fulfilled.match(result)) toast.success('Store profile saved')
    else toast.error(result.payload || 'Save failed')
  }

  const saveBanner = async () => {
    const result = await dispatch(updateBannerSettings({ banner, bannerImage: bannerFile }))
    if (updateBannerSettings.fulfilled.match(result)) {
      toast.success('Banner saved')
      setBannerFile(null)
    } else toast.error(result.payload || 'Save failed')
  }

  const saveShipping = async () => {
    const result = await dispatch(updateShippingSettings(shipping))
    if (updateShippingSettings.fulfilled.match(result)) toast.success('Shipping settings saved')
    else toast.error(result.payload || 'Save failed')
  }

  const savePassword = async (e) => {
    e.preventDefault()
    const r = await dispatch(changePassword(passwords))
    if (changePassword.fulfilled.match(r)) {
      toast.success(r.payload || 'Password updated')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } else toast.error(r.payload || 'Password update failed')
  }

  if (loading && !settings) return <LoadingSpinner label="Loading settings…" fullScreen />

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Settings" subtitle="Manage store profile, homepage banner, shipping, and account security" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SettingsCard icon={Store} title="Do'kon sozlamalari" subtitle="Store profile & contact" onSave={saveStore} saving={saving}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Support Phone"><input className="admin-input !pl-3" value={store.supportPhone} onChange={(e) => setStore((p) => ({ ...p, supportPhone: e.target.value }))} /></Field>
            <Field label="Store Email"><input type="email" className="admin-input !pl-3" value={store.storeEmail} onChange={(e) => setStore((p) => ({ ...p, storeEmail: e.target.value }))} /></Field>
            <Field label="Showroom Address"><input className="admin-input !pl-3 sm:col-span-2" value={store.address} onChange={(e) => setStore((p) => ({ ...p, address: e.target.value }))} /></Field>
            <Field label="Telegram URL"><input className="admin-input !pl-3" value={store.telegram} onChange={(e) => setStore((p) => ({ ...p, telegram: e.target.value }))} placeholder="https://t.me/..." /></Field>
            <Field label="Instagram URL"><input className="admin-input !pl-3" value={store.instagram} onChange={(e) => setStore((p) => ({ ...p, instagram: e.target.value }))} placeholder="https://instagram.com/..." /></Field>
          </div>
        </SettingsCard>

        <SettingsCard icon={Image} title="Banner boshqaruvi" subtitle="Homepage hero content" onSave={saveBanner} saving={saving}>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Eyebrow / Subtitle"><input className="admin-input !pl-3" value={banner.eyebrow} onChange={(e) => setBanner((p) => ({ ...p, eyebrow: e.target.value }))} /></Field>
            <Field label="Main Title"><input className="admin-input !pl-3" value={banner.title} onChange={(e) => setBanner((p) => ({ ...p, title: e.target.value }))} /></Field>
            <Field label="Discount %"><input type="number" min="0" max="100" className="admin-input !pl-3" value={banner.discountPercent} onChange={(e) => setBanner((p) => ({ ...p, discountPercent: e.target.value }))} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CTA Button Text"><input className="admin-input !pl-3" value={banner.ctaText} onChange={(e) => setBanner((p) => ({ ...p, ctaText: e.target.value }))} /></Field>
              <Field label="CTA Link"><input className="admin-input !pl-3" value={banner.ctaLink} onChange={(e) => setBanner((p) => ({ ...p, ctaLink: e.target.value }))} /></Field>
            </div>
            <Field label="Background / Hero Image">
              {bannerPreview && <div className="admin-image-slot h-28 mb-2"><img src={bannerPreview} alt="Banner" /></div>}
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setBannerFile(f); setBannerPreview(URL.createObjectURL(f)) }} />
              <button type="button" className="admin-btn admin-btn--outline" onClick={() => bannerInputRef.current?.click()}>Upload Banner Image</button>
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard icon={Truck} title="Payment & Shipping" subtitle="Checkout fee rules" onSave={saveShipping} saving={saving}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Default Shipping Fee ($)"><input type="number" min="0" step="0.01" className="admin-input !pl-3" value={shipping.defaultShippingFee} onChange={(e) => setShipping((p) => ({ ...p, defaultShippingFee: e.target.value }))} /></Field>
            <Field label="Free Shipping Threshold ($)"><input type="number" min="0" step="0.01" className="admin-input !pl-3" value={shipping.freeShippingThreshold} onChange={(e) => setShipping((p) => ({ ...p, freeShippingThreshold: e.target.value }))} /></Field>
          </div>
          <p className="text-xs text-[var(--admin-text-subtle)]">Orders at or above the threshold get free shipping at checkout.</p>
        </SettingsCard>

        <SettingsCard icon={Lock} title="Account Security" subtitle="Change your admin password">
          <form onSubmit={savePassword} className="grid grid-cols-1 gap-4">
            <Field label="Current Password"><input type="password" required className="admin-input !pl-3" value={passwords.currentPassword} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} /></Field>
            <Field label="New Password"><input type="password" required minLength={8} className="admin-input !pl-3" value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} /></Field>
            <Field label="Confirm Password"><input type="password" required className="admin-input !pl-3" value={passwords.confirmPassword} onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))} /></Field>
            <button type="submit" className="admin-btn admin-btn--primary self-start"><Lock className="h-4 w-4" />Update Password</button>
          </form>
        </SettingsCard>
      </div>
    </div>
  )
}

export default SettingsAdmin

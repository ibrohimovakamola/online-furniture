import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import { b2bApi } from '../api/b2bApi'
import B2BVerifiedGate from '../components/B2BVerifiedGate'
import { useB2BCart } from '../hooks/useB2BCart'
import { B2B_DELIVERY_METHODS, B2B_PAYMENT_TERMS } from '../data/b2bContent'
import { formatSom } from '@/features/kresla/utils/formatPrice'
import { useSelector } from 'react-redux'
import { selectUser } from '@/features/auth/authSlice'

const SHIPPING_RATES = { standard: 150_000, express: 350_000, custom: 0 }

export default function B2BCheckoutPage() {
  const { profile } = useOutletContext()
  const user = useSelector(selectUser)
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useB2BCart()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [useCompanyAddress, setUseCompanyAddress] = useState(true)
  const [shipping, setShipping] = useState({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    phone: profile?.phone || '',
    email: user?.email || '',
    street: profile?.businessAddress || '',
    city: '',
    postalCode: profile?.postalCode || '',
    region: '',
  })
  const [deliveryMethod, setDeliveryMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState(profile?.creditTerms === 'net60' ? 'net60' : profile?.creditTerms === 'net30' ? 'net30' : 'bank_transfer')
  const [poNumber, setPoNumber] = useState('')
  const [costCenter, setCostCenter] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [invoiceEmail, setInvoiceEmail] = useState(user?.email || '')
  const [attachInvoice, setAttachInvoice] = useState(true)

  const shippingCost = SHIPPING_RATES[deliveryMethod] ?? 150_000
  const tax = 0
  const total = subtotal + shippingCost + tax

  const paymentOptions = B2B_PAYMENT_TERMS.filter(
    (p) => !p.tier || p.tier === profile?.tier || profile?.tier === 'premium'
  )

  const placeOrder = async () => {
    setSubmitting(true)
    try {
      const notes = [
        orderNotes,
        costCenter && `Cost center: ${costCenter}`,
        `Delivery: ${B2B_DELIVERY_METHODS.find((d) => d.value === deliveryMethod)?.label}`,
        `Invoice to: ${invoiceEmail}`,
        attachInvoice ? 'Attach invoice to shipment: yes' : 'Attach invoice to shipment: no',
      ].filter(Boolean).join('\n')

      const { data } = await b2bApi.createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, color: i.color })),
        shippingAddress: shipping,
        paymentMethod: paymentMethod === 'net30' || paymentMethod === 'net60' ? 'bank_transfer' : paymentMethod,
        poNumber,
        orderNotes: notes,
      })

      try {
        await b2bApi.generateInvoice({ orderId: data.order.id })
      } catch {
        /* invoice optional */
      }

      clearCart()
      toast.success('Order placed successfully')
      navigate(`/designer-portal/orders/${data.order.id}`, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!items.length) {
    return (
      <B2BVerifiedGate>
        <p className="text-gray-600">Cart is empty. <Link to="/designer-portal/catalog" className="text-kresla-primary">Browse catalog</Link></p>
      </B2BVerifiedGate>
    )
  }

  return (
    <B2BVerifiedGate>
      <h2 className="text-2xl font-semibold text-kresla-dark mb-6">Checkout</h2>

      <div className="flex gap-2 mb-8 text-sm">
        {['Shipping', 'Payment & PO', 'Review'].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i + 1)}
            className={`px-4 py-2 rounded-lg font-medium ${step === i + 1 ? 'bg-kresla-dark text-white' : 'bg-white border'}`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <section className="rounded-xl bg-white border p-6 space-y-4">
              <h3 className="font-semibold">Shipping Address</h3>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={useCompanyAddress} onChange={(e) => {
                  setUseCompanyAddress(e.target.checked)
                  if (e.target.checked) {
                    setShipping((s) => ({ ...s, street: profile?.businessAddress || s.street, postalCode: profile?.postalCode || s.postalCode }))
                  }
                }} />
                Use company address (pre-filled)
              </label>
              {['fullName', 'phone', 'email', 'street', 'city', 'postalCode', 'region'].map((field) => (
                <input
                  key={field}
                  required={['fullName', 'phone', 'street', 'city'].includes(field)}
                  placeholder={field}
                  value={shipping[field] || ''}
                  onChange={(e) => setShipping((s) => ({ ...s, [field]: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              ))}
              <h3 className="font-semibold pt-4">Delivery Method</h3>
              {B2B_DELIVERY_METHODS.map((d) => (
                <label key={d.value} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="delivery" value={d.value} checked={deliveryMethod === d.value} onChange={() => setDeliveryMethod(d.value)} />
                  {d.label}
                </label>
              ))}
              <button type="button" onClick={() => setStep(2)} className="rounded-lg bg-kresla-dark text-white px-6 py-2 text-sm font-semibold">
                Continue
              </button>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-xl bg-white border p-6 space-y-4">
              <h3 className="font-semibold">Payment Terms</h3>
              {paymentOptions.map((p) => (
                <label key={p.value} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="pay" value={p.value} checked={paymentMethod === p.value} onChange={() => setPaymentMethod(p.value)} />
                  {p.label}
                </label>
              ))}
              <h3 className="font-semibold pt-4">Purchase Order</h3>
              <input placeholder="PO Number (optional)" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="Cost center / department" value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <textarea placeholder="Special delivery instructions" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm min-h-[80px]" />
              <h3 className="font-semibold pt-4">Invoice Preferences</h3>
              <input type="email" placeholder="Invoice email" value={invoiceEmail} onChange={(e) => setInvoiceEmail(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={attachInvoice} onChange={(e) => setAttachInvoice(e.target.checked)} />
                Attach invoice to shipment
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="rounded-lg border px-6 py-2 text-sm">Back</button>
                <button type="button" onClick={() => setStep(3)} className="rounded-lg bg-kresla-dark text-white px-6 py-2 text-sm font-semibold">Review</button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="rounded-xl bg-white border p-6 space-y-3 text-sm">
              <h3 className="font-semibold text-base">Final Review</h3>
              <p><strong>Items:</strong> {items.length} line(s)</p>
              <p><strong>Ship to:</strong> {shipping.street}, {shipping.city}</p>
              <p><strong>Delivery:</strong> {deliveryMethod}</p>
              <p><strong>Payment:</strong> {paymentMethod}</p>
              {poNumber && <p><strong>PO:</strong> {poNumber}</p>}
              <button type="button" disabled={submitting} onClick={placeOrder} className="mt-4 w-full rounded-lg bg-kresla-dark py-3 text-sm font-semibold text-white disabled:opacity-50">
                {submitting ? 'Placing order…' : 'Place Order'}
              </button>
            </section>
          )}
        </div>

        <div className="rounded-xl bg-white border p-6 h-fit text-sm space-y-2">
          <h3 className="font-semibold mb-3">Totals</h3>
          <div className="flex justify-between"><span>Subtotal</span><span>{formatSom(subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{formatSom(shippingCost)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{formatSom(tax)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-2"><span>Grand Total</span><span className="text-kresla-primary">{formatSom(total)}</span></div>
        </div>
      </div>
    </B2BVerifiedGate>
  )
}

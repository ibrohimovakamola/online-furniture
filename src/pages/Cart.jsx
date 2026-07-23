import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import '../assets/styles/cart.scss'
import '../assets/styles/product-customizer.scss'
import {
  decrementQuantity,
  incrementQuantity,
  removeFromCart,
  clearCart,
  updateItemColor,
  addToCart,
} from '../features/cart/cartSlice'
import { selectIsAuthenticated } from '../features/auth/authSlice'
import { selectSettings } from '../features/settings/settingsSlice'
import BreadCrumbs from '../components/BreadCrumbs'
import PremiumServicesBox from '../components/cart/PremiumServicesBox'
import { PREMIUM_SERVICE_FEES } from '../constants/premiumServices'
import { useWishlist } from '../features/kresla/hooks/useWishlist'
import { formatSom } from '../features/kresla/utils/formatPrice'
import InstallmentPlanCards, {
  InstallmentSummary,
} from '../components/checkout/InstallmentPlanCards'
import InstallmentPaymentSelector from '../components/checkout/InstallmentPaymentSelector'
import PaymentGateway, { parseGatewayResponse } from '../components/checkout/PaymentGateway'
import { storeApi } from '../api/storeApi'
import {
  fetchInstallmentPlans,
  selectCheckout,
  selectInstallmentPlans,
  setPaymentMethod,
  setSelectedPlanMonths,
  setInstallmentGateway,
  submitCheckout,
  submitGuestCheckout,
} from '../features/orders/orderSlice'
import { calculateInstallmentPlan } from '../utils/installmentPlans'
import { paymentApi } from '../services/paymentApi'

const EMPTY_PREMIUM = { deliveryToFloor: false, professionalAssembly: false }

function Cart() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cartItems = useSelector((state) => state.cart.items)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const settings = useSelector(selectSettings)
  const { list: wishlist, add: addWishlist, remove: removeWishlist } = useWishlist()

  const [step, setStep] = useState('cart')
  const [loading, setLoading] = useState(false)
  const [premiumServices, setPremiumServices] = useState(EMPTY_PREMIUM)
  const checkout = useSelector(selectCheckout)
  const installmentPlans = useSelector(selectInstallmentPlans)
  const { paymentMethod, selectedPlanMonths: installmentMonths, installmentGateway } = checkout
  const paymentMode = paymentMethod === 'installment' ? 'installment' : 'full'
  const [guestForm, setGuestForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: 'Toshkent',
    region: '',
  })
  const [guestPaymentMethod, setGuestPaymentMethod] = useState('cash')
  const [guestErrors, setGuestErrors] = useState({})
  const [guestTracking, setGuestTracking] = useState(null)
  const [shipping, setShipping] = useState({
    fullName: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
  })
  const [gateways, setGateways] = useState({ payme: false, click: false, uzumbank: false })
  const [installmentPaymentError, setInstallmentPaymentError] = useState('')

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const threshold = Number(settings?.shipping?.freeShippingThreshold) || 0
  const defaultFee = Number(settings?.shipping?.defaultShippingFee) || 0
  const shippingCost = threshold > 0 && subtotal >= threshold ? 0 : defaultFee

  const serviceFees = useMemo(() => {
    let total = 0
    if (premiumServices.deliveryToFloor) total += PREMIUM_SERVICE_FEES.deliveryToFloor
    if (premiumServices.professionalAssembly) total += PREMIUM_SERVICE_FEES.professionalAssembly
    return total
  }, [premiumServices])

  const totalPrice = subtotal + shippingCost + serviceFees
  const selectedPlan =
    installmentPlans.find((p) => p.planMonths === installmentMonths) ||
    calculateInstallmentPlan(totalPrice, installmentMonths)

  useEffect(() => {
    if (step === 'shipping' && paymentMethod === 'installment' && totalPrice > 0) {
      dispatch(fetchInstallmentPlans(totalPrice))
    }
  }, [dispatch, step, paymentMethod, totalPrice])

  useEffect(() => {
    if (step !== 'shipping' && step !== 'guest') return
    paymentApi
      .gateways()
      .then((res) => setGateways(parseGatewayResponse(res)))
      .catch(() => {})
  }, [step])

  const handlePremiumChange = (key, checked) => {
    setPremiumServices((prev) => ({ ...prev, [key]: checked }))
  }

  const handleCheckout = () => {
    if (isAuthenticated) {
      setStep('shipping')
      return
    }
    setStep('checkout-choice')
  }

  const saveForLater = (item) => {
    dispatch(removeFromCart(item.id))
    addWishlist(item)
    toast.success('Keyinga qoldirildi')
  }

  const restoreToCart = (item) => {
    removeWishlist(item.id)
    dispatch(addToCart({ ...item, quantity: item.quantity || 1 }))
    toast.success('Savatga qaytarildi')
  }

  const handleGuestOrder = async (e) => {
    e.preventDefault()
    const next = {}
    if (!guestForm.fullName.trim()) next.fullName = 'Ism kiriting'
    if (!guestForm.email.trim()) next.email = 'Email kiriting'
    if (!guestForm.phone.trim()) next.phone = 'Telefon kiriting'
    if (!guestForm.street.trim()) next.street = 'Manzil kiriting'
    if (!guestForm.city.trim()) next.city = 'Shahar kiriting'
    setGuestErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const result = await dispatch(
        submitGuestCheckout({
          guestName: guestForm.fullName.trim(),
          guestEmail: guestForm.email.trim(),
          guestPhone: guestForm.phone.trim(),
          items: cartItems.map((item) => ({
            productId: item.id,
            name: item.title || item.name,
            quantity: item.quantity,
            color: item.selectedColor || item.colors?.[0] || '',
          })),
          shippingAddress: {
            street: guestForm.street.trim(),
            city: guestForm.city.trim(),
            region: guestForm.region.trim(),
          },
          paymentMethod: guestPaymentMethod,
          totalPrice: totalPrice,
          premiumServices,
          returnUrl: `${window.location.origin}/payment/result`,
        })
      )

      if (submitGuestCheckout.rejected.match(result)) {
        toast.error(result.payload || 'Buyurtma yuborilmadi')
        return
      }

      const data = result.payload
      if (data.trackingToken) {
        sessionStorage.setItem('guestOrderTrackToken', data.trackingToken)
      }
      setGuestTracking({
        orderNumber: data.orderNumber,
        trackingLink: data.trackingLink,
        trackingToken: data.trackingToken,
      })

      if (data.paymentUrl) {
        dispatch(clearCart())
        setPremiumServices(EMPTY_PREMIUM)
        window.location.href = data.paymentUrl
        return
      }

      dispatch(clearCart())
      setPremiumServices(EMPTY_PREMIUM)
      setStep('success-guest')
      toast.success('Buyurtma qabul qilindi!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Buyurtma yuborilmadi')
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setInstallmentPaymentError('')
    setLoading(true)
    try {
      const isGateway =
        paymentMethod === 'payme' ||
        paymentMethod === 'click' ||
        paymentMethod === 'uzumbank'

      const payload = {
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.title || item.name,
          quantity: item.quantity,
          color: item.selectedColor || item.colors?.[0] || '',
          material: item.selectedMaterial || item.filters?.material || '',
        })),
        shippingAddress: shipping,
        paymentMethod:
          paymentMethod === 'installment'
            ? 'installment'
            : paymentMethod,
        premiumServices,
        returnUrl: `${window.location.origin}/payment/result`,
      }

      if (paymentMethod !== 'installment' && !isGateway) {
        toast.error('To\'lov tizimini tanlang (Payme, Click yoki Uzum Bank)')
        return
      }

      if (paymentMethod === 'installment') {
        if (!selectedPlan?.planMonths) {
          toast.error('Bo\'lib to\'lash rejasini tanlang')
          return
        }
        if (!installmentGateway) {
          const msg = 'To\'lov tizimini tanlang (Payme, Click yoki Uzum Bank)'
          setInstallmentPaymentError(msg)
          toast.error(msg)
          return
        }

        payload.installmentPlan = {
          planMonths: selectedPlan.planMonths,
          totalAmountWithInterest: selectedPlan.totalAmountWithInterest,
        }

        const result = await dispatch(submitCheckout(payload))
        if (submitCheckout.rejected.match(result)) {
          toast.error(result.payload || 'Checkout failed')
          return
        }

        const orderId =
          result.payload?.order?.id ||
          result.payload?.order?.orderId ||
          result.payload?.orderId

        if (!orderId) {
          toast.error('Buyurtma yaratildi, lekin to\'lovni boshlab bo\'lmadi')
          return
        }

        const { data: paymentData } = await storeApi.createPayment({
          orderId,
          paymentMethod: installmentGateway,
          amount: selectedPlan.monthlyPayment,
          installmentPeriod: selectedPlan.planMonths,
          returnUrl: `${window.location.origin}/payment/result`,
        })

        const paymentUrl =
          paymentData?.data?.paymentUrl ||
          paymentData?.data?.checkoutUrl ||
          paymentData?.paymentUrl

        if (!paymentUrl) {
          toast.error(paymentData?.message || 'To\'lov havolasi olinmadi')
          return
        }

        dispatch(clearCart())
        setPremiumServices(EMPTY_PREMIUM)
        window.location.href = paymentUrl
        return
      }

      const result = await dispatch(submitCheckout(payload))
      if (submitCheckout.rejected.match(result)) {
        toast.error(result.payload || 'Checkout failed')
        return
      }

      if (result.payload?.paymentUrl) {
        dispatch(clearCart())
        setPremiumServices(EMPTY_PREMIUM)
        window.location.href = result.payload.paymentUrl
        return
      }

      dispatch(clearCart())
      setPremiumServices(EMPTY_PREMIUM)
      toast.success(result.payload.message || 'Buyurtma qabul qilindi!')
      setStep('success')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success-guest') {
    const trackPath = guestTracking?.trackingToken
      ? `/track/${encodeURIComponent(guestTracking.trackingToken)}`
      : null

    return (
      <div className="container py-12">
        <div className="empty-card extra max-w-lg mx-auto text-center">
          <i className="fa-regular fa-circle-check text-4xl text-kresla-primary mb-4" />
          <p className="empty-text text-lg font-medium mb-2">Buyurtmangiz qabul qilindi!</p>
          {guestTracking?.orderNumber && (
            <p className="text-gray-600 mb-2">Buyurtma raqami: {guestTracking.orderNumber}</p>
          )}
          <p className="text-gray-600 mb-6">
            Tasdiq xati emailingizga yuborildi. Tez orada siz bilan bog&apos;lanamiz.
          </p>
          {trackPath && (
            <Link
              to={trackPath}
              className="inline-block mb-4 px-6 py-3 rounded-lg bg-kresla-primary text-white font-medium"
            >
              Buyurtmani kuzatish
            </Link>
          )}
          <br />
          <Link
            to="/sign-up"
            className="inline-block mb-4 text-sm text-kresla-primary hover:underline"
          >
            Hisobingizni yarating va 10% chegirma oling
          </Link>
          <br />
          <Link to="/products" className="empty-btn">
            Xaridni davom ettirish
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="container">
        <div className="empty-card extra">
          <i className="fa-regular fa-circle-check" />
          <p className="empty-text">Buyurtma muvaffaqiyatli joylashtirildi!</p>
          <Link to="/orders" className="empty-btn mb-3 inline-block">
            Buyurtmalarim
          </Link>
          <br />
          <Link to="/products" className="text-sm text-kresla-primary hover:underline">
            Xaridni davom ettirish
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'checkout-choice') {
    return (
      <div className="container py-12 max-w-md mx-auto">
        <BreadCrumbs />
        <h2 className="text-2xl font-semibold text-kresla-dark mb-6 text-center">Buyurtmani rasmiylashtirish</h2>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate('/login', { state: { from: '/cart' } })}
            className="w-full py-3 rounded-lg bg-kresla-primary text-white font-medium"
          >
            Tizimga kirish
          </button>
          <button
            type="button"
            onClick={() => setStep('guest')}
            className="w-full py-3 rounded-lg border-2 border-kresla-primary text-kresla-primary font-medium"
          >
            Mehmon sifatida davom etish
          </button>
          <button type="button" onClick={() => setStep('cart')} className="w-full text-sm text-gray-500">
            Orqaga
          </button>
        </div>
      </div>
    )
  }

  if (step === 'guest') {
    return (
      <div className="container py-12 max-w-md mx-auto">
        <BreadCrumbs />
        <h2 className="text-xl font-semibold mb-4">Mehmon buyurtmasi</h2>
        <form onSubmit={handleGuestOrder} className="space-y-4">
          {[
            ['fullName', 'Ism'],
            ['email', 'Email'],
            ['phone', 'Telefon (+998…)'],
            ['street', 'Manzil'],
            ['city', 'Shahar'],
            ['region', 'Viloyat (ixtiyoriy)'],
          ].map(([key, label]) => (
            <div key={key}>
              <input
                type={key === 'email' ? 'email' : 'text'}
                placeholder={label}
                value={guestForm[key]}
                onChange={(e) => setGuestForm((p) => ({ ...p, [key]: e.target.value }))}
                className="cart-form-input w-full"
              />
              {guestErrors[key] && <p className="text-red-600 text-xs mt-1">{guestErrors[key]}</p>}
            </div>
          ))}
          <div className="space-y-2">
            <p className="text-sm font-medium">To&apos;lov usuli</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="guestPayment"
                checked={guestPaymentMethod === 'cash'}
                onChange={() => setGuestPaymentMethod('cash')}
              />
              Naqd / yetkazib berganda
            </label>
            {gateways.payme && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="guestPayment"
                  checked={guestPaymentMethod === 'payme'}
                  onChange={() => setGuestPaymentMethod('payme')}
                />
                Payme
              </label>
            )}
            {gateways.click && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="guestPayment"
                  checked={guestPaymentMethod === 'click'}
                  onChange={() => setGuestPaymentMethod('click')}
                />
                Click
              </label>
            )}
            {gateways.uzumbank && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="guestPayment"
                  checked={guestPaymentMethod === 'uzumbank'}
                  onChange={() => setGuestPaymentMethod('uzumbank')}
                />
                Uzum Bank
              </label>
            )}
          </div>
          <p className="text-sm font-medium">Jami: {formatSom(totalPrice)}</p>
          <button type="submit" disabled={loading} className="cart-btn-primary w-full">
            {loading ? 'Yuborilmoqda…' : 'Buyurtma berish'}
          </button>
          <button type="button" onClick={() => setStep('checkout-choice')} className="text-sm text-gray-500">
            Orqaga
          </button>
        </form>
      </div>
    )
  }

  if (step === 'shipping') {
    return (
      <div className="container">
        <BreadCrumbs />
        <div className="cart cart--checkout">
          <h2 className="cart-checkout-title">Yetkazib berish va to&apos;lov</h2>
          <form onSubmit={handlePlaceOrder} className="cart-checkout-form">
            <div className="cart-checkout-grid">
              <div>
                <h3 className="cart-section-title">Yetkazib berish</h3>
                <div className="cart-form-fields">
                  {['fullName', 'phone', 'email', 'street', 'city', 'region', 'postalCode'].map((field) => (
                    <input
                      key={field}
                      required={['fullName', 'phone', 'street', 'city'].includes(field)}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={shipping[field]}
                      onChange={(e) => setShipping((p) => ({ ...p, [field]: e.target.value }))}
                      className="cart-form-input"
                    />
                  ))}
                </div>

                <h3 className="cart-section-title mt-6">To&apos;lov usuli</h3>
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => dispatch(setPaymentMethod('payme'))}
                    className={`px-4 py-2 rounded-lg text-sm ${paymentMode === 'full' ? 'bg-kresla-primary text-white' : 'border'}`}
                  >
                    To&apos;liq to&apos;lash
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(setPaymentMethod('installment'))}
                    className={`px-4 py-2 rounded-lg text-sm ${paymentMode === 'installment' ? 'bg-kresla-primary text-white' : 'border'}`}
                  >
                    Bo&apos;lib to&apos;lash
                  </button>
                </div>

                {paymentMode === 'installment' ? (
                  <div className="mb-4">
                    <InstallmentPlanCards
                      plans={installmentPlans.length ? installmentPlans : [selectedPlan].filter(Boolean)}
                      selectedMonths={installmentMonths}
                      onSelect={(months) => dispatch(setSelectedPlanMonths(months))}
                    />
                    <InstallmentSummary plan={selectedPlan} baseAmount={totalPrice} />
                    <InstallmentPaymentSelector
                      value={installmentGateway}
                      onChange={(method) => {
                        setInstallmentPaymentError('')
                        dispatch(setInstallmentGateway(method))
                      }}
                      installmentPlan={selectedPlan}
                      gateways={gateways}
                      loading={loading}
                      error={installmentPaymentError}
                    />
                  </div>
                ) : (
                  <PaymentGateway
                    gateways={gateways}
                    selectedMethod={paymentMethod}
                    onSelect={(method) => dispatch(setPaymentMethod(method))}
                    mode="full"
                    orderTotal={totalPrice}
                    loading={loading}
                  />
                )}
              </div>
              <aside>
                <PremiumServicesBox services={premiumServices} onChange={handlePremiumChange} />
                <div className="cart-summary-card">
                  <p>
                    Jami: <strong>{formatSom(subtotal)}</strong>
                  </p>
                  <p>
                    Yetkazish:{' '}
                    <strong>{shippingCost === 0 ? 'Bepul' : formatSom(shippingCost)}</strong>
                  </p>
                  {serviceFees > 0 && (
                    <p>
                      Premium: <strong>{formatSom(serviceFees)}</strong>
                    </p>
                  )}
                  {paymentMode === 'installment' && selectedPlan && (
                    <p className="text-kresla-primary text-sm mt-2">
                      Oylik to&apos;lov ({installmentMonths} oy):{' '}
                      <strong>{formatSom(selectedPlan.monthlyPayment)}</strong>
                    </p>
                  )}
                  <p className="cart-summary-total">
                    Umumiy:{' '}
                    <strong>
                      {formatSom(
                        paymentMode === 'installment' && selectedPlan
                          ? selectedPlan.totalAmountWithInterest
                          : totalPrice
                      )}
                    </strong>
                  </p>
                </div>
              </aside>
            </div>
            <div className="cart-checkout-actions">
              <button type="button" className="cart-btn-secondary" onClick={() => setStep('cart')}>
                Orqaga
              </button>
              <button type="submit" className="cart-btn-primary" disabled={loading}>
                {loading ? 'To\'lovga yo\'naltirilmoqda…' : 'Buyurtma berish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <BreadCrumbs />
      {cartItems.length > 0 ? (
        <div className="cart">
          <div className="cart-route">
            <h4 className="cart-route--title cart-start">Mahsulot</h4>
            <h4 className="cart-route--title">Narx</h4>
            <h4 className="cart-route--title">Miqdor</h4>
            <h4 className="cart-route--title cart-end">Jami</h4>
          </div>
          <div className="cart-wrapper">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-box">
                <div className="cart-info">
                  <button
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="cart-delete"
                    type="button"
                  >
                    <i className="fa-solid fa-circle-xmark" />
                  </button>
                  <img src={item.thumbnail || item.mainImage} alt={item.title || item.name} />
                  <div>
                    <h4>{item.title || item.name}</h4>
                    {item.selectedMaterial && (
                      <p className="cart-item-meta">Material: {item.selectedMaterial}</p>
                    )}
                    {item.colors?.length > 0 && (
                      <select
                        value={item.selectedColor || item.colors[0]}
                        onChange={(e) => dispatch(updateItemColor({ id: item.id, color: e.target.value }))}
                        className="cart-color-select"
                      >
                        {item.colors.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => saveForLater(item)}
                      className="text-xs text-kresla-primary mt-2 hover:underline block"
                    >
                      Keyinroq sotib olaman
                    </button>
                  </div>
                </div>
                <p className="cart-price">{formatSom(item.price)}</p>
                <div className="cart-count">
                  <div className="cart-couter-wrapper">
                    <p>{item.quantity}</p>
                    <div className="cart-counter">
                      <button type="button" onClick={() => dispatch(incrementQuantity(item.id))}>
                        <i className="fa-solid fa-angle-up" />
                      </button>
                      <button type="button" onClick={() => dispatch(decrementQuantity(item.id))}>
                        <i className="fa-solid fa-angle-down" />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="cart-price--end">{formatSom(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="cart-payment">
            <div className="cart-payment--card">
              <PremiumServicesBox services={premiumServices} onChange={handlePremiumChange} />
              <h4>Savat jami</h4>
              <div className="cart-payment--row">
                <p>Oraliq summa</p>
                <p>{formatSom(subtotal)}</p>
              </div>
              <div className="cart-payment--row">
                <p>Yetkazish</p>
                <p>{shippingCost === 0 ? 'Bepul' : formatSom(shippingCost)}</p>
              </div>
              {serviceFees > 0 && (
                <div className="cart-payment--row">
                  <p>Premium xizmatlar</p>
                  <p>{formatSom(serviceFees)}</p>
                </div>
              )}
              <div className="cart-payment--row">
                <p>Jami</p>
                <p>{formatSom(totalPrice)}</p>
              </div>
              <div className="cart-payment--btn">
                <button type="button" onClick={handleCheckout}>
                  Buyurtmani rasmiylashtirish
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-card extra">
          <i className="fa-solid fa-cart-shopping" />
          <p className="empty-text">Savat bo&apos;sh</p>
          <Link to="/products" className="empty-btn">
            Mahsulotlarga o&apos;tish
          </Link>
        </div>
      )}

      {wishlist.length > 0 && (
        <section className="mt-12 pb-12">
          <h3 className="text-xl font-semibold text-kresla-dark mb-4">Keyinga qoldirganlar</h3>
          <div className="space-y-4">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-gray-50"
              >
                <img
                  src={item.thumbnail || item.mainImage}
                  alt=""
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.title || item.name}</p>
                  <p className="text-sm text-kresla-primary">{formatSom(item.price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => restoreToCart(item)}
                  className="text-sm px-4 py-2 rounded-lg border border-kresla-primary text-kresla-primary hover:bg-kresla-primary hover:text-white transition-colors"
                >
                  Savatga qaytarish
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Cart

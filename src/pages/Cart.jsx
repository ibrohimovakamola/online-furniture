import { useMemo, useState } from 'react'
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
} from '../features/cart/cartSlice'
import { selectIsAuthenticated } from '../features/auth/authSlice'
import { selectSettings } from '../features/settings/settingsSlice'
import { storeApi } from '../api/storeApi'
import BreadCrumbs from '../components/BreadCrumbs'
import PremiumServicesBox from '../components/cart/PremiumServicesBox'
import { PREMIUM_SERVICE_FEES } from '../constants/premiumServices'

const EMPTY_PREMIUM = { deliveryToFloor: false, professionalAssembly: false }

function Cart() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cartItems = useSelector((state) => state.cart.items)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const settings = useSelector(selectSettings)

  const [step, setStep] = useState('cart')
  const [loading, setLoading] = useState(false)
  const [premiumServices, setPremiumServices] = useState(EMPTY_PREMIUM)
  const [shipping, setShipping] = useState({
    fullName: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
  })
  const [payment, setPayment] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
  })

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

  const handlePremiumChange = (key, checked) => {
    setPremiumServices((prev) => ({ ...prev, [key]: checked }))
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout')
      navigate('/login', { state: { from: '/cart' } })
      return
    }
    setStep('shipping')
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await storeApi.checkout({
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.title || item.name,
          quantity: item.quantity,
          color: item.selectedColor || item.colors?.[0] || '',
          material: item.selectedMaterial || item.filters?.material || '',
        })),
        shippingAddress: shipping,
        paymentMethod: 'online',
        payment,
        premiumServices,
      })
      dispatch(clearCart())
      setPremiumServices(EMPTY_PREMIUM)
      toast.success(data.message || 'Order placed successfully!')
      setStep('success')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="container">
        <div className="empty-card extra">
          <i className="fa-regular fa-circle-check" />
          <p className="empty-text">Order placed successfully!</p>
          <Link to="/products" className="empty-btn">Continue shopping</Link>
        </div>
      </div>
    )
  }

  if (step === 'shipping') {
    return (
      <div className="container">
        <BreadCrumbs />
        <div className="cart cart--checkout">
          <h2 className="cart-checkout-title">Shipping &amp; Payment</h2>
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
                <h3 className="cart-section-title">To‘lov</h3>
                <div className="cart-form-fields">
                  <input
                    required
                    placeholder="Name on card"
                    value={payment.cardName}
                    onChange={(e) => setPayment((p) => ({ ...p, cardName: e.target.value }))}
                    className="cart-form-input"
                  />
                  <input
                    required
                    placeholder="Card number"
                    value={payment.cardNumber}
                    onChange={(e) => setPayment((p) => ({ ...p, cardNumber: e.target.value }))}
                    className="cart-form-input"
                  />
                  <div className="cart-form-row">
                    <input
                      required
                      placeholder="MM/YY"
                      value={payment.expiry}
                      onChange={(e) => setPayment((p) => ({ ...p, expiry: e.target.value }))}
                      className="cart-form-input"
                    />
                    <input
                      required
                      placeholder="CVV"
                      value={payment.cvv}
                      onChange={(e) => setPayment((p) => ({ ...p, cvv: e.target.value }))}
                      className="cart-form-input"
                    />
                  </div>
                </div>
              </div>
              <aside>
                <PremiumServicesBox services={premiumServices} onChange={handlePremiumChange} />
                <div className="cart-summary-card">
                  <p>
                    Subtotal: <strong>${subtotal.toFixed(2)}</strong>
                  </p>
                  <p>
                    Shipping: <strong>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</strong>
                  </p>
                  {serviceFees > 0 && (
                    <p>
                      Premium xizmatlar: <strong>${serviceFees.toFixed(2)}</strong>
                    </p>
                  )}
                  <p className="cart-summary-total">
                    Total: <strong>${totalPrice.toFixed(2)}</strong>
                  </p>
                </div>
              </aside>
            </div>
            <div className="cart-checkout-actions">
              <button type="button" className="cart-btn-secondary" onClick={() => setStep('cart')}>
                Back
              </button>
              <button type="submit" className="cart-btn-primary" disabled={loading}>
                {loading ? 'Processing…' : 'Place Order'}
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
            <h4 className="cart-route--title cart-start">Product</h4>
            <h4 className="cart-route--title">Price</h4>
            <h4 className="cart-route--title">Quantity</h4>
            <h4 className="cart-route--title cart-end">Subtotal</h4>
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
                  </div>
                </div>
                <p className="cart-price">${item.price}</p>
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
                <p className="cart-price--end">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="cart-payment">
            <div className="cart-payment--card">
              <PremiumServicesBox services={premiumServices} onChange={handlePremiumChange} />
              <h4>Cart Total</h4>
              <div className="cart-payment--row">
                <p>Subtotal</p>
                <p>${subtotal.toFixed(2)}</p>
              </div>
              <div className="cart-payment--row">
                <p>Shipping</p>
                <p>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</p>
              </div>
              {serviceFees > 0 && (
                <div className="cart-payment--row">
                  <p>Premium xizmatlar</p>
                  <p>${serviceFees.toFixed(2)}</p>
                </div>
              )}
              <div className="cart-payment--row">
                <p>Total</p>
                <p>${totalPrice.toFixed(2)}</p>
              </div>
              <div className="cart-payment--btn">
                <button type="button" onClick={handleCheckout}>
                  Proceed to checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-card extra">
          <i className="fa-solid fa-cart-shopping" />
          <p className="empty-text">The basket is empty</p>
          <Link to="/products" className="empty-btn">
            Go to products
          </Link>
        </div>
      )}
    </div>
  )
}

export default Cart

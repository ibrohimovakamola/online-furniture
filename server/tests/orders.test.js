import { api } from './helpers/testApp.js'
import {
  createTestCategory,
  createTestProduct,
  createTestUser,
  createTestAdmin,
  TEST_PASSWORD,
  shippingAddress,
} from './helpers/fixtures.js'

async function loginUser(email) {
  const login = await (await api())
    .post('/api/auth/login')
    .send({ email, password: TEST_PASSWORD })
  return login.body.token
}

async function addToCart(token, productId, quantity = 1) {
  return (await api())
    .post('/api/cart')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: String(productId), quantity })
}

describe('Orders API', () => {
  let user
  let token
  let product

  beforeEach(async () => {
    const category = await createTestCategory()
    product = await createTestProduct(category._id, { stock: 5 })
    user = await createTestUser()
    token = await loginUser(user.email)
    await addToCart(token, product._id, 1)
  })

  it('POST /api/orders — creates order from cart (cash)', async () => {
    const address = shippingAddress({ email: user.email, phone: '+998901112233' })
    const res = await (await api())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: address,
        paymentMethod: 'cash',
        notes: 'Test order',
      })
      .expect(201)

    expect(res.body.success).toBe(true)
    const data = res.body.data
    expect(data?.orderId || data?.order?._id).toBeDefined()
    expect(data.status).toBe('pending')
  })

  it('GET /api/orders — lists user orders', async () => {
    const address = shippingAddress({ email: user.email, phone: '+998901112233' })
    await (await api())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ shippingAddress: address, paymentMethod: 'cash' })

    const res = await (await api())
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body.success).toBe(true)
    const orders = res.body.data?.orders || res.body.orders || []
    expect(orders.length).toBeGreaterThan(0)
  })

  it('POST /api/orders — 400 when cart is empty', async () => {
    await (await api())
      .delete('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const address = shippingAddress({ email: user.email, phone: '+998901112233' })
    const res = await (await api())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ shippingAddress: address, paymentMethod: 'cash' })
      .expect(400)

    expect(res.body.statusCode).toBe(400)
  })

  it('PUT /api/orders/:orderId/status — admin updates status', async () => {
    const address = shippingAddress({ email: user.email, phone: '+998901112233' })
    const created = await (await api())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ shippingAddress: address, paymentMethod: 'cash' })

    const orderId = created.body.data?.orderId || created.body.data?.order?._id

    const admin = await createTestAdmin()
    const adminToken = await loginUser(admin.email)

    const res = await (await api())
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed', note: 'Test confirm' })
      .expect(200)

    expect(res.body.success).toBe(true)
  })

  it('GET /api/health — returns API status', async () => {
    const res = await (await api()).get('/api/health').expect(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.database).toBe('connected')
  })
})

describe('Orders — guest checkout', () => {
  it('POST /api/orders/guest — creates guest order', async () => {
    const category = await createTestCategory()
    const product = await createTestProduct(category._id)

    const res = await (await api())
      .post('/api/orders/guest')
      .send({
        guestEmail: 'guest@test.com',
        guestPhone: '+998909876543',
        guestName: 'Guest Buyer',
        items: [{ productId: String(product._id), quantity: 1, price: 1_500_000 }],
        shippingAddress: {
          street: 'Navoi 10',
          city: 'Tashkent',
        },
        paymentMethod: 'cash',
        totalPrice: 1_500_000,
      })
      .expect(201)

    expect(res.body.success).toBe(true)
  })
})

import { api } from './helpers/testApp.js'
import {
  createTestCategory,
  createTestProduct,
  createTestUser,
  createTestAdmin,
  TEST_PASSWORD,
} from './helpers/fixtures.js'

describe('Products API', () => {
  let category
  let product
  let adminToken

  beforeEach(async () => {
    category = await createTestCategory()
    product = await createTestProduct(category._id, {
      name_uz: 'Premium divan',
      slug: `premium-divan-${Date.now()}`,
    })

    const admin = await createTestAdmin()
    const login = await (await api())
      .post('/api/auth/login')
      .send({ email: admin.email, password: TEST_PASSWORD })
    adminToken = login.body.token
  })

  it('GET /api/products — lists published products', async () => {
    const res = await (await api()).get('/api/products').expect(200)
    expect(res.body.success).toBe(true)
    const items = res.body.data?.products || res.body.products || res.body.data
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
  })

  it('GET /api/products/:id — returns product detail', async () => {
    const res = await (await api()).get(`/api/products/${product._id}`).expect(200)
    expect(res.body.success).toBe(true)
    const detail = res.body.data?.product || res.body.product || res.body.data
    expect(String(detail._id || detail.id)).toBe(String(product._id))
  })

  it('GET /api/products/:id — 404 for missing product', async () => {
    const fakeId = '507f1f77bcf86cd799439011'
    const res = await (await api()).get(`/api/products/${fakeId}`).expect(404)
    expect(res.body.statusCode).toBe(404)
  })

  it('GET /api/categories — lists categories', async () => {
    const res = await (await api()).get('/api/categories').expect(200)
    expect(res.body.success).toBe(true)
  })

  it('POST /api/products — admin create requires images (400)', async () => {
    const res = await (await api())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name_uz', 'Yangi mahsulot')
      .field('basePrice', '2000000')
      .field('stock', '5')
      .field('category', String(category._id))
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.statusCode).toBe(400)
  })

  it('POST /api/products — rejects unauthenticated request', async () => {
    await (await api())
      .post('/api/products')
      .send({ name_uz: 'Hack', basePrice: 1000, category: category._id })
      .expect(401)
  })

  it('GET /api/products/search — requires query', async () => {
    const res = await (await api()).get('/api/products/search?q=divan').expect(200)
    expect(res.body.success).toBe(true)
  })
})

describe('Products — customer cannot delete', () => {
  it('DELETE /api/products/:id — forbidden for customer', async () => {
    const category = await createTestCategory()
    const product = await createTestProduct(category._id)
    const user = await createTestUser()
    const login = await (await api())
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD })

    await (await api())
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(403)
  })
})

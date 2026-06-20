import Order from '../../../src/models/Order.js'
import { createTestCategory, createTestProduct, createTestUser } from '../../helpers/fixtures.js'
import { shippingAddress } from '../../helpers/fixtures.js'

describe('Order Model', () => {
  let product
  let customer

  beforeEach(async () => {
    const category = await createTestCategory()
    product = await createTestProduct(category._id)
    customer = await createTestUser()
  })

  function baseOrder(overrides = {}) {
    return {
      orderNumber: `ORD-TEST-${Date.now()}`,
      customer: customer._id,
      items: [
        {
          product: product._id,
          name: product.name,
          quantity: 1,
          unitPrice: 1_500_000,
          lineTotal: 1_500_000,
        },
      ],
      shippingAddress: shippingAddress(),
      subtotal: 1_500_000,
      total: 1_500_000,
      status: 'pending',
      paymentStatus: 'unpaid',
      ...overrides,
    }
  }

  it('should create order with required fields', async () => {
    const order = await Order.create(baseOrder())
    expect(order.orderNumber).toMatch(/^ORD-TEST-/)
    expect(order.items).toHaveLength(1)
    expect(order.total).toBe(1_500_000)
  })

  it('should reject empty items array', async () => {
    await expect(
      Order.create(baseOrder({ items: [] }))
    ).rejects.toThrow()
  })

  it('should validate order status enum', async () => {
    await expect(
      Order.create(baseOrder({ status: 'invalid_status' }))
    ).rejects.toThrow()
  })

  it('should default paymentStatus to unpaid', async () => {
    const order = await Order.create(baseOrder())
    expect(order.paymentStatus).toBe('unpaid')
  })
})

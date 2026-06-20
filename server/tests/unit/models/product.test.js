import Product from '../../../src/models/Product.js'
import { createTestCategory, createTestProduct } from '../../helpers/fixtures.js'

describe('Product Model', () => {
  let category

  beforeEach(async () => {
    category = await createTestCategory()
  })

  it('should require category and basePrice', async () => {
    await expect(Product.create({ name: 'No category' })).rejects.toThrow()
  })

  it('should create product with valid data', async () => {
    const product = await createTestProduct(category._id)
    expect(product.basePrice).toBe(1_500_000)
    expect(product.stock).toBe(10)
    expect(String(product.category)).toBe(String(category._id))
  })

  it('should validate hex color format', async () => {
    await expect(
      createTestProduct(category._id, { colors: ['not-a-hex'] })
    ).rejects.toThrow()
  })

  it('should accept valid hex colors', async () => {
    const product = await createTestProduct(category._id, { colors: ['#ff5500'] })
    expect(product.colors).toEqual(['#ff5500'])
  })

  it('should default isPublished to true when set', async () => {
    const product = await createTestProduct(category._id, { isPublished: true })
    expect(product.isPublished).toBe(true)
  })
})

import Category from '../../src/models/Category.js'
import Product from '../../src/models/Product.js'
import User from '../../src/models/User.js'
import { ROLES } from '../../src/config/roles.js'

export const TEST_PASSWORD = 'SecurePass1!'

/** Unique +998 phone for sparse/partial unique index on User.phone */
export function uniqueTestPhone(seed = Date.now()) {
  const digits = String(seed).replace(/\D/g, '').slice(-9).padStart(9, '0')
  return `+998${digits}`
}

export async function createTestCategory(overrides = {}) {
  const suffix = Date.now()
  return Category.create({
    name: `Divanlar-${suffix}`,
    name_uz: `Divanlar-${suffix}`,
    name_ru: 'Диваны',
    name_en: 'Sofas',
    slug: `divanlar-${suffix}`,
    ...overrides,
  })
}

export async function createTestProduct(categoryId, overrides = {}) {
  let createdBy = overrides.createdBy
  if (!createdBy) {
    const owner = await createTestAdmin()
    createdBy = owner._id
  }

  const rest = { ...overrides }
  delete rest.createdBy

  return Product.create({
    name: 'Test Sofa',
    name_uz: 'Test divan',
    basePrice: 1_500_000,
    price: 1_500_000,
    stock: 10,
    category: categoryId,
    isPublished: true,
    slug: `test-sofa-${Date.now()}`,
    createdBy,
    ...rest,
  })
}

export async function createTestUser(overrides = {}) {
  const suffix = Date.now()
  return User.create({
    firstName: 'Test',
    lastName: 'User',
    email: `user-${suffix}@test.com`,
    phone: uniqueTestPhone(suffix),
    password: TEST_PASSWORD,
    role: ROLES.CUSTOMER,
    ...overrides,
  })
}

export async function createTestAdmin(overrides = {}) {
  const suffix = Date.now() + 1
  return User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: `admin-${suffix}@test.com`,
    phone: uniqueTestPhone(suffix),
    password: TEST_PASSWORD,
    role: ROLES.SUPER_ADMIN,
    ...overrides,
  })
}

export function shippingAddress(overrides = {}) {
  return {
    fullName: 'Ali Valiyev',
    phone: '+998901234567',
    email: 'ali@test.com',
    street: 'Amir Temur 1',
    city: 'Tashkent',
    region: 'Tashkent',
    country: 'Uzbekistan',
    ...overrides,
  }
}

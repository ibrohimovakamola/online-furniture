import Category from '../models/Category.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { ROLES } from '../config/roles.js'
import { slugify } from '../utils/helpers.js'

const DEFAULT_CATEGORIES = ['Sofas', 'Sectionals', 'Chairs', 'Beds', 'Dining', 'Office']

export async function seedAdminData() {
  if (process.env.SEED_ADMIN_DATA !== 'true') return

  const admin = await User.findOne({ role: ROLES.SUPER_ADMIN })
  if (!admin) return

  const productCount = await Product.countDocuments()
  if (productCount > 0) return

  let sofaCat = await Category.findOne({ name: /^Sofas$/i })
  if (!sofaCat) {
    const categories = await Category.insertMany(
      DEFAULT_CATEGORIES.map((name) => ({ name, slug: slugify(name) }))
    )
    sofaCat = categories.find((c) => c.name === 'Sofas') || categories[0]
  }

  await Product.insertMany([
    {
      name: 'Milano Modular Sectional',
      sku: 'MLN-SEC-001',
      slug: slugify('Milano Modular Sectional'),
      description: 'Premium modular sectional with left and right arm configurations.',
      basePrice: 2499,
      discountedPrice: 2199,
      category: sofaCat._id,
      stock: 12,
      colors: ['#0b3c3c', '#1a2626'],
      mainImage: null,
      materials: ['Premium Velvet', 'Natural Leather', 'Turkiya matosi'],
      dimensions: { width: 320, height: 85, depth: 165, unit: 'cm' },
      filters: { color: '#0b3c3c', material: 'Premium Velvet', productType: 'Sectional' },
      images: [],
      createdBy: admin._id,
      isPublished: true,
    },
    {
      name: 'Heritage Leather Sofa',
      sku: 'HTG-SOF-002',
      slug: slugify('Heritage Leather Sofa'),
      description: 'Handcrafted leather sofa with kiln-dried hardwood frame.',
      basePrice: 1899,
      category: sofaCat._id,
      stock: 8,
      colors: ['#1a2626', '#5eead4'],
      mainImage: null,
      materials: ['Natural Leather', 'Premium Velvet', 'Turkiya matosi'],
      dimensions: { width: 220, height: 92, depth: 98, unit: 'cm' },
      filters: { color: '#1a2626', material: 'Natural Leather', productType: 'Sofa' },
      images: [],
      createdBy: admin._id,
      isPublished: true,
    },
  ])

  const demoCustomers = [
    {
      firstName: 'Demo',
      lastName: 'Customer',
      email: 'customer@exclusive.uz',
      password: 'Customer123!',
      address: 'Tashkent, Chilonzor',
    },
    {
      firstName: 'Sardor',
      lastName: 'Karimov',
      email: 'sardor@exclusive.uz',
      password: 'Customer123!',
      address: 'Samarkand, Registon',
    },
    {
      firstName: 'Nilufar',
      lastName: 'Rahimova',
      email: 'nilufar@exclusive.uz',
      password: 'Customer123!',
      address: 'Tashkent, Yunusobod',
    },
  ]

  let customer = await User.findOne({ role: ROLES.CUSTOMER })
  for (const demo of demoCustomers) {
    const exists = await User.findOne({ email: demo.email })
    if (!exists) {
      const created = await User.create({ ...demo, role: ROLES.CUSTOMER })
      if (!customer) customer = created
    }
  }
  if (!customer) {
    customer = await User.findOne({ role: ROLES.CUSTOMER })
  }

  const products = await Product.find().limit(2)

  if (products.length && !(await Order.findOne())) {
    await Order.create({
      orderNumber: `ORD-${Date.now()}`,
      customer: customer._id,
      items: products.map((p) => ({
        product: p._id,
        name: p.name,
        quantity: 1,
        unitPrice: p.discountedPrice || p.basePrice,
        lineTotal: p.discountedPrice || p.basePrice,
      })),
      status: 'pending',
      paymentStatus: 'paid',
      paymentMethod: 'online',
      shippingAddress: {
        fullName: 'Demo Customer',
        phone: '+998901234567',
        street: '123 Navoi St',
        city: 'Tashkent',
      },
      subtotal: products.reduce((s, p) => s + (p.discountedPrice || p.basePrice), 0),
      total: products.reduce((s, p) => s + (p.discountedPrice || p.basePrice), 0),
      statusHistory: [{ status: 'pending', changedBy: admin._id }],
    })
  }

  console.log('Admin demo data seeded (categories, products, sample order)')
}

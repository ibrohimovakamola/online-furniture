export const B2B_COMPANY_TYPES = [
  { value: 'interior_designer', label: 'Interior Designer' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'other', label: 'Other' },
]

export const B2B_EMPLOYEE_RANGES = [
  { value: '1_5', label: '1–5 employees' },
  { value: '6_20', label: '6–20 employees' },
  { value: '21_50', label: '21–50 employees' },
  { value: '51_200', label: '51–200 employees' },
  { value: 'over_200', label: '200+ employees' },
]

export const B2B_TURNOVER_RANGES = [
  { value: 'under_500m', label: 'Under 500 million UZS' },
  { value: '500m_2b', label: '500M – 2 billion UZS' },
  { value: '2b_10b', label: '2 – 10 billion UZS' },
  { value: '10b_50b', label: '10 – 50 billion UZS' },
  { value: 'over_50b', label: 'Over 50 billion UZS' },
]

export const B2B_ACCOUNT_MANAGERS = [
  {
    id: 'dilnoza',
    name: 'Dilnoza Karimova',
    title: 'B2B Account Manager',
    email: 'b2b@kresla.uz',
    phone: '+998 90 123 45 67',
    whatsapp: '+998901234567',
    responseGuaranteeHours: 2,
  },
  {
    id: 'sardor',
    name: 'Sardor Rakhimov',
    title: 'Senior B2B Consultant',
    email: 'sardor.b2b@kresla.uz',
    phone: '+998 91 234 56 78',
    whatsapp: '+998912345678',
    responseGuaranteeHours: 4,
  },
  {
    id: 'nilufar',
    name: 'Nilufar Tosheva',
    title: 'Project Partnerships',
    email: 'nilufar.b2b@kresla.uz',
    phone: '+998 93 456 78 90',
    whatsapp: '+998934567890',
    responseGuaranteeHours: 4,
  },
]

export const B2B_STATUS_LABELS = {
  pending: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 ring-amber-200' },
  under_review: { label: 'Under Review', className: 'bg-blue-100 text-blue-800 ring-blue-200' },
  verified: { label: 'Verified Partner', className: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  rejected: { label: 'Not Approved', className: 'bg-red-100 text-red-800 ring-red-200' },
}

export const B2B_BENEFITS = [
  'Up to 20% wholesale pricing with volume discounts',
  'Dedicated account manager — 2-hour response guarantee',
  'Net 30 / Net 60 credit terms for verified partners',
  'Kresla B2B catalog & early access to new collections',
  'Invoice & PO tracking with PDF export',
  'Bulk ordering, CSV upload & order templates',
]

export const B2B_FAQ = [
  {
    q: 'What is the minimum order quantity?',
    a: 'Standard MOQ is 5 units per SKU. Verified hotel and construction partners may request project-based exceptions.',
  },
  {
    q: 'How long does verification take?',
    a: 'We review STIR/INN documents and business licenses within 1–2 business days after submission.',
  },
  {
    q: 'What are the payment terms?',
    a: 'Prepay, Net 30, and Net 60 are available depending on credit approval and order history.',
  },
  {
    q: 'What is the delivery lead time?',
    a: 'In-stock items ship within 3–5 business days. Custom configurations require 14–21 days.',
  },
  {
    q: 'What is the return policy for B2B orders?',
    a: 'Defective items are replaced within 7 days. Custom-made products are non-returnable unless damaged in transit.',
  },
]

export const B2B_CASE_STUDIES = [
  {
    client: 'Studio Nova Interiors',
    headline: '500+ seating units for a boutique hotel chain',
    metric: '18% cost savings vs retail',
    logo: 'SN',
  },
  {
    client: 'BuildPro Construction',
    headline: 'Full furnishing package for 120-apartment complex',
    metric: 'Delivered in 6 weeks',
    logo: 'BP',
  },
  {
    client: 'Urban Living Retail',
    headline: 'Seasonal restock partnership — 2,000 units/year',
    metric: 'Net 60 credit approved',
    logo: 'UL',
  },
]

export const DEFAULT_ACCOUNT_MANAGER = B2B_ACCOUNT_MANAGERS[0]

export const B2B_DOCUMENTS = [
  { name: 'B2B Supply Agreement', type: 'PDF', href: '#' },
  { name: 'Invoice Template', type: 'PDF', href: '#' },
  { name: 'Delivery & Payment Terms', type: 'PDF', href: '#' },
  { name: 'Bank Transfer Details', type: 'PDF', href: '#' },
]

export function labelForCompanyType(value) {
  return B2B_COMPANY_TYPES.find((t) => t.value === value)?.label || value
}

export function labelForTurnover(value) {
  return B2B_TURNOVER_RANGES.find((t) => t.value === value)?.label || value
}

export function labelForEmployees(value) {
  return B2B_EMPLOYEE_RANGES.find((t) => t.value === value)?.label || value
}

export function labelForManager(id) {
  return B2B_ACCOUNT_MANAGERS.find((m) => m.id === id)?.name || '—'
}

export const B2B_ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'Spring Collection — B2B Early Access',
    body: 'Premium partners get 48h early access to the Milano seating line.',
    date: 'May 28, 2026',
  },
  {
    id: '2',
    title: 'Net 30 terms now available',
    body: 'Verified partners with 3+ completed orders may request Net 30 credit.',
    date: 'May 15, 2026',
  },
]

export const ORDER_TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', statuses: ['pending', 'processing', 'shipped', 'delivered'] },
  { key: 'payment', label: 'Payment Confirmed', payment: ['paid'] },
  { key: 'processing', label: 'Processing', statuses: ['processing', 'shipped', 'delivered'] },
  { key: 'quality', label: 'Quality Check', statuses: ['processing', 'shipped', 'delivered'] },
  { key: 'packed', label: 'Packed', statuses: ['shipped', 'delivered'] },
  { key: 'shipped', label: 'Shipped', statuses: ['shipped', 'delivered'] },
  { key: 'transit', label: 'In Transit', statuses: ['shipped', 'delivered'] },
  { key: 'delivered', label: 'Delivered', statuses: ['delivered'] },
]

export const B2B_MATERIALS = ['Leather', 'Fabric', 'Metal', 'Wood', 'Plastic', 'Hybrid']

export const B2B_DELIVERY_METHODS = [
  { value: 'standard', label: 'Standard (7–10 business days)', days: 10 },
  { value: 'express', label: 'Express (2–3 business days)', days: 3 },
  { value: 'custom', label: 'Custom arrangement (large orders)', days: 14 },
]

export const B2B_PAYMENT_TERMS = [
  { value: 'bank_transfer', label: 'Pay Now (bank transfer)' },
  { value: 'card', label: 'Pay Now (card)' },
  { value: 'net30', label: 'Net 30 (30-day terms)', tier: 'standard' },
  { value: 'net60', label: 'Net 60 (60-day terms)', tier: 'premium' },
]

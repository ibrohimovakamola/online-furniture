/**
 * Client-side CMS store for features not yet on the API.
 * Gallery is served from MongoDB + Cloudinary via adminApi.gallery / galleryApi.
 */

const KEYS = {
  b2bLeads: 'exclusive_admin_b2b_leads',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/* ─── B2B Leads ─── */

function seedB2BLeads() {
  return [
    {
      id: uid(),
      companyName: 'Studio Nova Interiors',
      contactPerson: 'Aziza Karimova',
      phone: '+998 90 123 45 67',
      email: 'aziza@studionova.uz',
      volumeDetails: '12-piece living room package for new showroom',
      notes: 'Requested 15% trade discount and 45-day payment terms.',
      status: 'new',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: uid(),
      companyName: 'Grand Hotel Tashkent',
      contactPerson: 'Rustam Bek',
      phone: '+998 93 555 12 34',
      email: 'procurement@grandhotel.uz',
      volumeDetails: '80 guest room beds + lobby seating',
      notes: 'Needs installation timeline before Q3 opening.',
      status: 'in_progress',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: uid(),
      companyName: 'Dadam Design Bureau',
      contactPerson: 'Malika Sodiqova',
      phone: '+998 97 800 22 11',
      email: 'malika@dadam.uz',
      volumeDetails: 'Custom modular sofas — 6 units',
      notes: 'Completed sample approval. Invoice sent.',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
  ]
}

export function loadB2BLeads() {
  const stored = read(KEYS.b2bLeads, null)
  if (stored?.length) return stored
  const seeded = seedB2BLeads()
  write(KEYS.b2bLeads, seeded)
  return seeded
}

export function saveB2BLeads(leads) {
  write(KEYS.b2bLeads, leads)
}

export function updateB2BLead(id, patch) {
  const next = loadB2BLeads().map((lead) =>
    lead.id === id ? { ...lead, ...patch, updatedAt: new Date().toISOString() } : lead
  )
  saveB2BLeads(next)
  return next.find((l) => l.id === id)
}


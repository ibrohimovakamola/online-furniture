export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota */
  }
}

export const STORAGE_KEYS = {
  recentlyViewed: 'recentlyViewed',
  compareList: 'compareList',
  wishlist: 'wishlist',
  flashSaleEmails: 'kresla_flashSaleEmails',
  designerApplications: 'kresla_designerApplications',
  designerSession: 'kresla_designerSession',
  deliveryDistrict: 'kresla_deliveryDistrict',
  showroomLayout: 'kresla_showroomLayout',
  guestOrders: 'kresla_guestOrders',
}

import { getProductImageSource } from '@/utils/productImage'

/** @typedef {{ id: string, name: string, imageUrl: string }} ShowroomCatalogItem */

/**
 * @param {import('@/utils/productImage').ProductLike} product
 * @returns {ShowroomCatalogItem | null}
 */
export function mapProductToCatalogItem(product) {
  if (!product?.id) return null

  const imageUrl = getProductImageSource(product)
  if (!imageUrl) return null

  return {
    id: String(product.id),
    name: (product.title || product.name || 'Mebel').trim(),
    imageUrl,
  }
}

/**
 * @param {unknown[]} products
 * @returns {ShowroomCatalogItem[]}
 */
export function mapProductsToCatalog(products) {
  if (!Array.isArray(products)) return []
  return products.map(mapProductToCatalogItem).filter(Boolean)
}

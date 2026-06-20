export function getStockCount(productId) {
  const str = String(productId || '0')
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 17 + str.charCodeAt(i)) % 1000
  }
  return 2 + (hash % 7)
}

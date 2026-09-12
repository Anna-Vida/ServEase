export function formatServicePrice(price: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(price)
}

export function isBookableService(isActive: boolean) {
  return isActive
}

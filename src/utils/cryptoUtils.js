export function normalizePurchases(asset) {
  if (asset.purchases?.length) return asset.purchases
  if (asset.units > 0) {
    const totalInvested = asset.purchasePrice ?? 0
    return [{
      id: 'legacy',
      units: asset.units,
      pricePerUnit: totalInvested / asset.units,
      date: asset.purchaseDate || null,
    }]
  }
  return []
}

export function getCryptoStats(asset) {
  const purchases = normalizePurchases(asset)
  const units = purchases.reduce((sum, p) => sum + p.units, 0)
  const totalInvested = purchases.reduce((sum, p) => sum + p.units * p.pricePerUnit, 0)
  const avgPrice = units > 0 ? totalInvested / units : 0
  return { purchases, units, totalInvested, avgPrice }
}

export function syncCryptoAsset(asset, purchases) {
  const { units, totalInvested } = getCryptoStats({ ...asset, purchases })
  return {
    ...asset,
    purchases,
    units,
    purchasePrice: totalInvested,
  }
}

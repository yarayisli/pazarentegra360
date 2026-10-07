// Placeholder: simulates authenticating against Trendyol SAPIGW.
// Replaced by a real API client in the Trendyol integration epic.
export function verifyCredentials(supplierId: string) {
  return {
    message: `Trendyol Entegrasyonu Başarılı (Satıcı ID: ${supplierId})`,
    storeName: `Mağaza #${supplierId}`,
    rateLimitRemaining: 98,
    syncedAt: new Date().toISOString()
  };
}

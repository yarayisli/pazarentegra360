# ADR 0013: Ortak pazaryeri adaptör sözleşmesi

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-12
- **İlgili:** #48, #14, ADR 0001

## Bağlam

Trendyol, Hepsiburada, N11 ve ikas entegrasyonları aynı sekiz işlemi sunmalı (CLAUDE.md). Arayüz yokken her adaptör kendi şeklini icat eder; servisler ve işler pazaryerine bağımlı hale gelir. Bu karar gerçek bir pazaryeri uç noktası içermez.

## Kararlar

- `server/integrations/types.ts` içinde `MarketplaceAdapter` arayüzü: `fetchOrders`, `fetchProducts`, `updateStockPrice`, `updateOrderStatus`, `fetchQuestions`, `answerQuestion`, `fetchClaims`, `fetchSettlements`, ve `code` + `capabilities` alanları.
- Okuma metotları imleç tabanlı sayfalama kullanır: girdi `{ cursor?, pageSize? }`, çıktı `{ items, nextCursor? }` (`nextCursor` yoksa son sayfa). Pazaryerinin sayfa numarası/imleci adaptörün içinde saklanır.
- Normalize tipler (`MarketplaceOrder`, `MarketplaceProduct`, `MarketplaceQuestion`, `MarketplaceClaim`, `MarketplaceSettlement`) `src/types.ts` ile aynı durum/pazaryeri adlarını kullanır; ham yanıtlar adaptör dışına çıkmaz.
- `capabilities`: desteklenen metotların listesi. Desteklenmeyen metot `NotSupportedError` fırlatır (ikas/POS gibi kanallarda bazı metotlar olmayabilir).
- Güvenlik freni: yazan metotlar (`updateStockPrice`, `updateOrderStatus`, `answerQuestion`) `{ dryRun?: boolean }` kabul eder. `dryRun: true` iken pazaryerine/depoya hiçbir şey yazılmaz; sonuç `dryRun: true` ve `applied: false` döner. İnsan onayı ve fiyat düşüşü sınırı gibi iş kuralları çağıran serviste uygulanır (#17, #20), adaptörde değil.
- `registry.ts`: `createAdapterRegistry()` fabrika fonksiyonu (modül düzeyinde durum yok). `register(code, factory)` ve `create(code, ctx)`; bilinmeyen kod `UnknownMarketplaceError`, bilinen ama kaydı olmayan kod `AdapterNotRegisteredError` fırlatır.
- `mock/` altında bellek içi test adaptörü ve `contract.ts` içinde `runAdapterContractTests(name, factory)`; her yeni adaptör kendi testinde bu paketi çalıştırmak zorundadır.
- Yeni bağımlılık yok.

## Değerlendirilen alternatifler

- **Pazaryeri başına ayrı servis sınıfları (ortak arayüz yok):** servis katmanı dallanır, reddedildi.
- **Sayfa numarası tabanlı sayfalama:** ikas gibi imleç kullanan kanallara uymaz; imleç opak olduğu için her iki tarzı da taşır.
- **`dryRun`'ı çağıran serviste uygulamak:** adaptör bypass edilirse fren kalkar; adaptör sözleşmesinde zorunlu tutuldu.

## Sonuçlar

Pazaryeri işleri (#14–#23 ve sonraki epic'ler) bu arayüzü uygular ve sözleşme testlerinden geçer. Arayüze metot eklemek bu ADR'nin güncellenmesini gerektirir.

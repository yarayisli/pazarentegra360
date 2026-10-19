# ADR 0015: Giden işlemler için ortak güvenlik freni ve insan onay kuyruğu

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-19
- **İlgili:** #53, #48, #49, #17, #18, #20, #32

## Bağlam

CLAUDE.md; fiyat düşüren, stok sıfırlayan, siparişi iptal eden veya müşteriye mesaj gönderen işlemlerin insan onayı / güvenlik freni olmadan çalışmasını yasaklar. Adaptör arayüzünde (ADR 0013) yalnızca `dryRun` vardır; pazaryerinden bağımsız bir "risk değerlendirme + onay" katmanı yoktur. #17, #18, #20 ve ileride repricer (#32) giden işlemlerini bu katmandan geçirecek.

## Kararlar

- **Yeni tablo `pending_actions`:** tenant, pazaryeri hesabı, pazaryeri kodu, işlem tipi, yük (`payload`, jsonb), risk nedeni, durum, oluşturan/karar veren kullanıcı, `created_at`, `expires_at`, `decided_at`, `executed_at`, `error`. Durumlar: `PENDING | APPROVED | REJECTED | EXPIRED | EXECUTED | FAILED`. `FAILED` (spesifikasyona ek): onaylandıktan sonra adaptör hata verdiyse; aynı satır otomatik yeniden denenmez (tam bir kez).
- **Yeni sütun `tenants.price_drop_threshold_pct`** (varsayılan 30): tenant bazlı fiyat düşüşü eşiği. Bu issue eşiği değiştiren bir API sunmaz (ayarlar ekranı ayrı iş).
- **`server/services/safetyGuard.ts`, saf fonksiyon `evaluateAction(action, {priceDropThresholdPct})`** → `ALLOW` veya `REQUIRE_APPROVAL` + neden. Kurallar:
  - `UPDATE_STOCK_PRICE`: fiyat düşüşü > eşik; mevcut fiyat bilinmeden fiyat gönderimi (fail-safe); stoğun 0'a çekilmesi.
  - `UPDATE_ORDER_STATUS`: iptal (`Cancelled`) her zaman; tek bir istekte birden çok iptal de aynı kural kapsamındadır.
  - `ANSWER_QUESTION`: müşteriye giden mesaj her zaman.
- **Akış (`server/services/pendingActions.ts`):** `submitAction` önce kuralı değerlendirir. `ALLOW` ise doğrudan çalıştırır; `REQUIRE_APPROVAL` ise adaptöre hiç dokunmadan `PENDING` satır yazar. `approve` satırı `UPDATE … WHERE status='PENDING' AND expires_at > now() RETURNING` ile atomik olarak sahiplenir (çift onay / yarış ikinci kez çalıştırmaz), sonra adaptörde önce `dryRun: true`, sonra gerçek çağrıyı yapar.
- **Adaptör çözümü:** servisler `AdapterResolver` (`(tenantId, accountId, marketplace) => MarketplaceAdapter`) alır; `createApp({ resolveAdapter })` ile enjekte edilir. Gerçek adaptörler kayıtlanana kadar varsayılan çözücü `AdapterNotRegisteredError` fırlatır (onay `FAILED` olur).
- **HTTP:** `GET /api/pending-actions`, `POST /api/pending-actions/:id/approve|reject`; tümü `requireAuth` arkasında, tenant yalnızca `tenantIdOf(req)` ile; hepsinde sorgu `tenant_id` ile filtrelenir. Rate limit uygulanır.
- **Kayıt:** her karar `pending_actions` satırında (karar veren, zaman, durum) saklanır; sipariş durumu işlemlerinde ayrıca `order_events`'e (`eventSource: USER_ACTION`) yazılır. Genel denetim kaydı (#54) hazır olunca aynı olaylar oraya da yazılacaktır.
- **Süre dolumu:** pg-boss işi `expire-pending-actions` (cron `*/10 * * * *`), süresi geçen `PENDING` satırları `EXPIRED` yapar. `approve` da süreyi kendisi kontrol ettiği için iş gecikse bile süresi dolan işlem çalışmaz. Varsayılan süre 24 saat.

## Değerlendirilen alternatifler

- **Kuralı her çağıranda ayrı yazmak (#17 içinde fren):** tekrar ve tutarsızlık; ortak katman seçildi.
- **Onay yerine yalnızca reddetmek:** kullanıcı meşru büyük indirimi yapamazdı.
- **Kullanıcı bazlı onay yetkisi:** henüz rol modeli yok; oturumdaki tenant'ın her kullanıcısı onaylayabilir.

## Sonuçlar

- Migration: `pending_actions` tablosu, `tenants.price_drop_threshold_pct`.
- Sonraki issue'lar (#17, #18, #20) giden yazma işlemlerini `submitAction` üzerinden yapmalıdır.

# ADR 0009: Event Store ve webhook logları veritabanında

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-10
- **İlgili:** #10, #7, #8

## Bağlam

`orderEventStore`, `webhookLogs` ve `processedWebhookKeys` sunucu belleğinde tutuluyordu; yeniden başlatmada kayboluyor, çoklu süreçte tutarsız oluyordu.

## Kararlar

- Bellek yapıları kaldırıldı; `order_events` ve `webhook_logs` tabloları kullanılır (`server/services/eventStore.ts`).
- Idempotency ayrı bir anahtar kümesi yerine `order_events (tenant_id, idempotency_key)` unique index'i ile sağlanır. Olay `INSERT ... ON CONFLICT DO NOTHING` ile yazılır; satır dönmezse webhook mükerrerdir. Eşzamanlı aynı webhook'ta yalnızca bir insert kazanır.
- `order_events.order_external_id` (bigint, nullable) eklendi: API pazaryerinin paket numarasıyla (`orderId`) sorgular; sipariş henüz `orders` tablosunda yoksa (ör. webhook önce geldi) de olay saklanabilir. İndeks: `(tenant_id, order_external_id)`.
- `order_events` append-only: servis yalnızca `insert` ve `select` sunar; update/delete fonksiyonu yoktur (testle kilitli).
- Örnek kayıtlar `seedDemo`'ya taşındı; yeni kayıt olan tenant boş başlar.

## Değerlendirilen alternatifler

- **DB trigger ile update/delete engelleme:** tenant silme (cascade) ve `orders` silinince `order_id` null'lanması (UPDATE) ile çakışır; uygulama düzeyinde zorlama seçildi.
- **Ayrı `processed_webhook_keys` tablosu:** mevcut unique index yeterli, ek tablo gereksiz.

## Sonuçlar

- Migration: `order_events.order_external_id` + indeks.
- Webhook/olay rotaları artık `db` alır ve asenkrondur.

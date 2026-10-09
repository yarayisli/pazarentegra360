# ADR 0006: Arka plan iş kuyruğu (pg-boss)

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-09
- **İlgili:** #11, ADR 0003

## Bağlam

Sipariş çekme, stok/fiyat eşitleme ve mutabakat gibi işler periyodik ve tekrar denenebilir çalışmalı. Ek altyapı (Redis) istemiyoruz; PostgreSQL zaten var (ADR 0003).

## Kararlar

- Bağımlılık: `pg-boss` (Postgres tabanlı kuyruk, cron, retry). Kendi `pg-boss` şeması, ilk `start()` sırasında kurulur; Drizzle migration'larından bağımsızdır.
- İş tanımı kalıbı `server/jobs/definitions.ts`: `{ name, handler, retryLimit, retryDelaySeconds, cron?, accountScoped? }`. Yeni iş `server/jobs/registry.ts` listesine eklenir.
- Hata alan iş `retryLimit` kadar üstel geri çekilmeyle (`retryBackoff`) tekrar denenir.
- `accountScoped` işler `{ tenantId, accountId }` taşır ve `singleton` kuyruk politikası + `singletonKey = tenantId:accountId` ile kuyruklanır: aynı hesap için aynı iş aynı anda yalnızca bir kez çalışır, farklı hesaplar paralel çalışır. Kuyruğa yalnızca `enqueueAccountJob()` ile yazılır.
- Worker API'den ayrı süreç olarak çalışabilir: `npm run worker` (`server/jobs/worker.ts`). API süreci pg-boss'u yalnızca iş göndermek/okumak için başlatır (`supervise` ve `schedule` kapalı); cron'u ve işleri yalnızca worker çalıştırır.
- `GET /api/jobs` (auth'lu): kayıtlı işler, cron ifadesi ve son durumları. Tenant verisi sızmasın diye hesap bazlı kuyruklarda yalnızca oturumdaki tenant'ın işleri döner; sistem işlerinde (ör. `heartbeat`) kuyruk sayaçları döner.
- Testler `@electric-sql/pglite` + pg-boss'un `fromPglite` adaptörüyle çalışır; gerçek Postgres gerekmez.
- Güvenlik freni: bu PR'daki tek iş `heartbeat`'tir ve pazaryerine yazmaz. Fiyat/stok/iptal/mesaj gibi yazan işler kendi issue'larında insan onayı veya güvenlik freniyle eklenir.

## Değerlendirilen alternatifler

- **BullMQ/Redis:** ek altyapı.
- **Süreç içi `setInterval`:** kalıcılık, retry ve çoklu örnek koordinasyonu yok.

## Sonuçlar

- pg-boss Node >=22.12 ister (projenin hedefi Node 22).
- Üretimde worker ayrı süreç/konteyner olarak çalıştırılmalıdır; çalışmazsa işler kuyrukta birikir.
- pglite tek bağlantılıdır; gerçek Postgres'e özgü farkları CI'daki Postgres yakalar.

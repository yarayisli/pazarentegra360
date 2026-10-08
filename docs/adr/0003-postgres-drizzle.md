# ADR 0003: PostgreSQL + Drizzle ORM

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-08
- **İlgili:** #7, #8, #9, #10, #11

## Bağlam

Veriler tarayıcı `localStorage`'ında ve sunucu belleğinde tutuluyor. Çok kiracılı, kalıcı bir veri katmanı gerekiyor. İş kuyruğu (#11) da Postgres tabanlı `pg-boss` ile çalışacak.

## Kararlar

- Veritabanı PostgreSQL 16; yerel geliştirme için `docker-compose.yml`.
- ORM: `drizzle-orm` + `drizzle-kit` (migration üretimi). Sürücü: `pg` (üretim/geliştirme). Şema `server/db/schema.ts`, migration'lar `server/db/migrations/` altında ve commit edilir.
- Her iş tablosunda `tenant_id` vardır (`tenants` hariç); tüm sorgular ileride (#8) tenant ile filtrelenecek.
- `marketplace_accounts.encrypted_credentials` yalnızca şifreli metin tutar; şifreleme #9'da eklenir. Seed gerçek/sahte anahtar yazmaz.
- `order_events` append-only olarak tasarlandı (uygulama update/delete yapmaz; zorlama #10'da).
- Testler `@electric-sql/pglite` (gömülü Postgres, WASM) ile aynı migration'ları çalıştırır; böylece Docker olmadan yerelde ve CI'da DB'li test mümkündür.
- CI'a Postgres 16 service container ve `DATABASE_URL` eklendi; CI'da `npm run db:migrate && npm run db:seed` gerçek Postgres'e karşı çalışır. Birim testleri her zaman pglite kullanır.
- Zaman damgaları `timestamptz`; para alanları `numeric(12,2)` (string olarak okunur).

## Değerlendirilen alternatifler

- **Prisma:** ek kod üretimi ve ağır çalışma zamanı; Drizzle SQL'e daha yakın ve hafif.
- **Testlerde yalnızca gerçek Postgres:** yerelde Docker zorunlu olur; pglite bunu kaldırır.
- **SQLite:** pg-boss ve üretim hedefiyle uyumsuz.

## Sonuçlar

- Yeni bağımlılıklar: `drizzle-orm`, `pg`, `drizzle-kit`, `@electric-sql/pglite`, `@types/pg` (son üçü dev).
- Şema değişince `npm run db:generate` ile migration üretilip commit edilmelidir.
- pglite ile gerçek Postgres arasında küçük davranış farkları olabilir; CI'daki service container bunu yakalar.

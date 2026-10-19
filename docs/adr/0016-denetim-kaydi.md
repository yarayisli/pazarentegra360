# ADR 0016: Denetim kaydı (audit log)

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-19
- **İlgili:** #54, #8, #9, #10, ADR 0015

## Bağlam

Hesap ekleme/silme, kimlik bilgisi değişikliği ve giriş/çıkış gibi hassas işlemlerin kullanıcı bazında izi yok. Mağaza sahibi "bunu kim değiştirdi?" sorusunu cevaplayabilmeli; onay kuyruğunun (ADR 0015) kararları da ileride aynı kayda yazılacak.

## Kararlar

- **Yeni tablo `audit_logs`:** `id`, `tenant_id`, `user_id` (kullanıcı silinirse `set null`), `action`, `target_type`, `target_id`, `summary`, `ip`, `created_at`. Dizin: `(tenant_id, created_at)`.
- **Eylem adları:** `auth.register`, `auth.login`, `auth.logout`, `marketplace_account.create|update|delete`. `update` yalnızca hangi alan **adlarının** değiştiğini yazar.
- **Gizli bilgi kaydedilmez:** `summary` yalnızca alan adları ve pazaryeri/mağaza adı içerir, değer içermez. `recordAudit` ayrıca özet metnindeki gizli alan adlarına ait değerleri (`anahtar=değer` biçimi) maskeler; kimlik bilgisi değerleri hiçbir koşulda audit kaydına aktarılmaz.
- **`server/services/audit.ts`:** `recordAudit(db, req, entry)`; tenant ve kullanıcı oturumdan (`req.auth`) alınır. Giriş/kayıt gibi oturumun henüz olmadığı rotalarda `entry.actor` açıkça verilir. Audit yazımı başarısız olursa asıl işlem bozulmaz; hata `req.log` ile loglanır.
- **`GET /api/audit-logs`:** `requireAuth` arkasında, her zaman oturumdaki tenant ile filtrelenir. Sorgu: `page`, `pageSize` (en çok 100), `action`, `from`, `to` (ISO tarih). Sıralama: en yeni önce.
- Onay kuyruğu kararlarının (ADR 0015) bu kayda yazılması ayrı bir iştir.

## Değerlendirilen alternatifler

- **Yalnızca uygulama logu:** tenant bazlı sorgulanamaz, saklama süresi belirsiz.
- **Değerlerin önce/sonra farkını saklamak:** gizli bilgi sızma riski; yalnızca alan adları yeterli görüldü.

## Sonuçlar

- Migration: `audit_logs` tablosu.
- Yeni hassas rotalar `recordAudit` çağırmalıdır.

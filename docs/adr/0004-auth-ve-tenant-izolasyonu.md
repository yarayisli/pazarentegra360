# ADR 0004: Kimlik doğrulama ve tenant izolasyonu

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-08
- **İlgili:** #8, ADR 0002, ADR 0003

## Bağlam

Tüm `/api` uç noktaları herkese açıktı ve veri tenant'a bağlı değildi. Çok kiracılı şema (ADR 0003) hazır; şimdi giriş, oturum ve tenant filtresi gerekiyor.

## Kararlar

- **Yeni tablo `sessions`** (`id`, `tenant_id`, `user_id`, `token_hash`, `expires_at`, `created_at`). Tarayıcıya yalnızca rastgele 32 baytlık token gider; veritabanında SHA-256 özeti saklanır, böylece DB sızsa da oturum çalınamaz.
- **Oturum çerezi:** `pe360_session`, `HttpOnly`, `SameSite=Lax` (yabancı sitelerden gelen POST'lar çerezi taşımaz; ayrı CSRF token'ı bu aşamada gerekmiyor), üretimde `Secure`. Süre 7 gün. Çerez ayrıştırma elle yapılır (`cookie-parser` eklenmedi).
- **Parola özeti:** Node'un yerleşik `crypto.scrypt` fonksiyonu (N=16384, r=8, p=1, 16 bayt tuz, 64 bayt çıktı), `scrypt$N$r$p$tuz$özet` biçiminde saklanır ve `timingSafeEqual` ile doğrulanır. Issue "argon2 veya bcrypt" diyordu; scrypt de bellek-zorlayıcı, standart bir parola KDF'sidir ve yerel derleme/ek bağımlılık gerektirmediği için seçildi (CLAUDE.md: gereksiz bağımlılık yok). Parametreler özetin içinde olduğundan ileride artırılabilir.
- **Kullanıcı numaralandırmayı azaltma:** Bilinmeyen e-posta ile girişte de sahte bir scrypt hesaplanır; hata mesajı iki durumda aynıdır.
- **`requireAuth` middleware'i:** `/api/health` ve `/api/auth/*` rotaları middleware'den önce bağlanır (herkese açık); sonrasındaki her `/api` rotası oturum ister, yoksa 401 döner. Pazaryeri webhook alıcısı (#21) kendi doğrulamasıyla aynı şekilde middleware'den önce bağlanacaktır; şu an yalnızca simülasyon uç noktası var ve o oturum ister.
- **Tenant izolasyonu:** `req.auth.tenantId` yalnızca oturumdan gelir, asla istek gövdesinden. Bellek içi event store/webhook logları tenant bazlı ayrıldı (`createTenantStores`); DB'ye taşınınca (#10) her sorgu `tenant_id` ile filtrelenecek.
- **Oran sınırı:** `express-rate-limit` (ADR 0002) ile giriş ve kayıt uç noktalarında.
- `createApp({ db })` artık bir Drizzle veritabanı alır (node-postgres veya pglite).

## Değerlendirilen alternatifler

- **argon2 / bcrypt paketi:** yerel derleme veya ek bağımlılık gerektirir; scrypt aynı amacı karşılıyor.
- **JWT:** iptal (logout) edilemez; sunucu tarafı oturum tablosu daha basit ve güvenli.
- **Oturum token'ını düz saklamak:** DB sızıntısında oturum ele geçirilir, reddedildi.

## Sonuçlar

- Oran sınırı sayaçları bellek içi ve süreç başınadır (ADR 0002'deki kısıt geçerli).
- Eski/yetim oturumlar için temizlik işi pg-boss geldiğinde (#11) eklenebilir; süresi dolan oturumlar doğrulamada zaten reddedilir.
- Çok kiracılı şemada e-posta global tekildir (bir e-posta tek tenant'a ait).

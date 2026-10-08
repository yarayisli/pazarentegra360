# ADR 0002: Rate limiting (express-rate-limit)

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-08
- **İlgili:** #5, #8, #12, PR #37

## Bağlam

Modüler yapıya taşıma sırasında CodeQL, `/api/trendyol/verify-credentials` rotası için "Missing rate limiting" uyarısı verdi. Rota pazaryerine kimlik doğrulama denemesi yaptığı için sınırsız çağrılması istenmez. Bağımlılık eklemeden yazılan bellek içi özel middleware CodeQL tarafından tanınmadı ve uyarı sürdü.

## Kararlar

`express-rate-limit` paketi eklendi (geçişli olarak `ip-address`). `verify-credentials` rotası IP başına dakikada 10 istekle sınırlıdır; aşımda 429 ve `Retry-After` döner. Paket #8 (giriş) ve #12 (AI uç noktaları) için de kullanılacak.

## Değerlendirilen alternatifler

- **Özel middleware (bağımlılıksız):** denendi; CodeQL tanımadı, uyarı sürdü.
- **Uyarıyı kapatmak:** kalite kapısını zayıflatır, reddedildi.

## Sonuçlar

- Bellek içi sayaç tek süreçte çalışır; birden fazla süreç/örnek olduğunda ortak bir store (ör. Postgres/Redis) gerekir.
- Ters proxy arkasında Express `trust proxy` ayarlanmazsa tüm istemciler tek IP sayılır; dağıtımda ayarlanmalıdır.
- #8 ve #12'de aynı paket yeniden kullanılacak.

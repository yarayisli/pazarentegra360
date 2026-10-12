# ADR 0014: Ortak pazaryeri HTTP istemcisi

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-12
- **İlgili:** #49

## Bağlam

Her pazaryeri adaptörü dış API'ye istek atacak; zaman aşımı, yeniden deneme, hız sınırı ve log maskeleme her adaptörde tekrar yazılmamalı.

## Kararlar

- `server/integrations/http.ts`: Node 22 yerleşik `fetch` üzerine `createHttpClient()`. Yeni bağımlılık yok.
- Yeniden deneme yalnızca GET ve yalnızca 429/502/503/504'te; üstel geri çekilme (`baseDelayMs * 2^n`, `maxDelayMs` ile sınırlı), `Retry-After` (saniye veya HTTP tarihi) varsa o kullanılır. POST/PUT/PATCH/DELETE asla yeniden denenmez (çift işlem riski).
- İstemci tarafı hız sınırı jeton kovasıdır; değerler (`requestsPerSecond`, `burst`) her pazaryeri adaptöründe resmi dokümandan doğrulanarak verilir, burada varsayılan yoktur. İstekler sıraya alınır, eşzamanlılık sınırı aşamaz.
- Hatalar: `MarketplaceHttpError` (durum kodu, 500 karaktere kısaltılmış gövde), `MarketplaceTimeoutError`. `errorHandler` bunları 502 `UPSTREAM_ERROR` / 504 `UPSTREAM_TIMEOUT` olarak eşler; gövde ve ayrıntı yanıta sızmaz.
- Log: yalnızca yol (sorgu dizesi değil) ve maskelenmiş başlıklar; `Authorization`, `Cookie`, `*token*`, `*secret*`, `*key*` değerleri `[REDACTED]`.
- Testler `fetch` enjekte edilerek yapılır; gerçek ağ yok. Bu yüzden `msw`/`nock` eklenmedi.

## Sonuçlar

- Adaptörler (#14 ve epic'ler) bu istemciyi kullanır; pazaryerine özgü URL ve hız limitleri onlarda tanımlanır.

# ADR 0017: Express 5'e geçiş

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-20
- **İlgili:** #57

## Bağlam

Sunucu Express 4 kullanıyordu; Express 5 ve `@types/express` 5 yayınlandı. Express 4 ileride bakım dışı kalabilir. Güvenlik açığı yok, acil değil.

## Kararlar

- `express` ^5 ve `@types/express` ^5'e yükseltildi.
- **Joker yol:** SPA yedek yolu `app.get("*")` yerine `app.get("/{*splat}")` (path-to-regexp 8). Başka joker/isteğe bağlı parametreli yol yok.
- **Sorgu ayrıştırıcı:** Express 5 varsayılanı `simple`; `createApp` içinde `app.set("query parser", "extended")` ile Express 4 davranışı korundu (`?action[]=x` dizi olarak gelir, audit rotası bunu 400 ile reddediyor).
- Async rota işleyicilerinde reddedilen promise artık otomatik `next(err)` olur; mevcut `try/catch` + `next(err)` kalıpları geçerli kalır, davranış değişmez.
- `req.body` gövdesiz isteklerde `undefined` olabilir; `validate` zaten `req.body ?? {}` kullanıyor.
- Kapsam dışı: `req.query`'yi atayan kod yok (Express 5'te salt okunur); `express-rate-limit` 8 Express 5 ile uyumlu.

## Doğrulama

Mevcut testler değiştirilmeden geçer; `npm run build && npm start` ile `/api/health`, arayüz ve SPA yedek yolu elle doğrulandı.

## Güvenlik güncellemesi

- `body-parser` 2.3.0 üstüne yükseltildi (GHSA-27r3-jxmh-p828, sıkıştırılmış gövde sonrası fazladan baytla DoS); yalnızca lockfile değişti, `express` sürüm aralığı aynı.

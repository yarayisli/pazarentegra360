# ADR 0008: Config doğrulama, loglama ve merkezi hata yönetimi (zod, pino)

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-10
- **İlgili:** #6

## Bağlam

Ortam değişkenleri dağınık okunuyor ve doğrulanmıyor; loglar `console.*` ile düz metin; hata yanıtları rotadan rotaya farklı (`message` / `error.code`); istek gövdeleri elle doğrulanıyor.

## Kararlar

- **`zod`** (tek yeni bağımlılık, tip çıkarımı ve yapılandırılmış hata listesi sağlar): env doğrulaması (`loadConfig`) ve istek gövdesi doğrulaması (`validate()` middleware).
- **`pino`**: JSON yapılandırılmış log, `LOG_LEVEL` ile seviye; testlerde sessiz. Her isteğe `X-Request-Id` (gelen başlık geçerliyse korunur, yoksa UUID) atanır ve erişim logu bu kimlikle yazılır. Ek HTTP-log paketi (`pino-http`) eklenmedi; küçük bir middleware yeterli.
- Hata biçimi `{ success:false, error:{ code, message } }`. Yakalanmamış hata → 500 `INTERNAL_ERROR`, ayrıntı yalnızca logda; yanıta stack/mesaj sızmaz. Bozuk JSON → 400 `INVALID_JSON`; geçersiz gövde → 400 `VALIDATION_ERROR`.
- Üretimde (`NODE_ENV=production`) `CREDENTIALS_ENCRYPTION_KEY` zorunlu ve geçerli olmalı; yoksa süreç anlaşılır bir hata ile başlamaz. Geliştirmede opsiyonel kalır (rota 503 döner).
- Mevcut `console.error` çağrıları logger'a taşınır. Rotalara özel hata kodları (auth) korunur; yalnızca doğrulaması basit olan uç noktalar `validate()`'e geçirilir.

## Değerlendirilen alternatifler

- **`pino-http`**, **`express-validator`/`joi`**: ek bağımlılık; gereksiz.
- **`winston`**: JSON/performans açısından pino tercih edildi.

## Sonuçlar

- `webhooks/simulate` ve `trendyol/verify-credentials` 400 yanıtları `error.{code,message}` biçimine geçer (`message` üst düzey alanı kalkar). Arayüz bu alanı okumuyor.
- Geliştirmede okunabilir log için `pino-pretty` ayrıca çalıştırılabilir (`npm run dev | npx pino-pretty`); projeye bağımlılık olarak eklenmedi.

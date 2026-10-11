# ADR 0010: AI uç noktalarının sağlamlaştırılması

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-11
- **İlgili:** #12, #6, #8, ADR 0002

## Bağlam

`/api/ai/copilot` ve `/api/ai/suggest-reply` kullanıcı girdisini prompt metnine gömüyordu, model adı koda sabitlenmişti ve API anahtarı yokken (ya da hata durumunda) uydurma rakamlı sahte analizler ve müşteriye gidebilecek taahhütlü (%100 orijinal, 2 yıl garanti) şablon cevaplar dönüyordu.

## Kararlar

- Model adı `GEMINI_MODEL` env değişkeninden okunur; varsayılan `gemini-2.5-flash`.
- Sistem talimatı (`config.systemInstruction`) ile kullanıcı içeriği ayrıdır. Kullanıcı girdileri JSON-string olarak "veri" bölümlerine konur; talimat veri sayılır. Zod ile uzunluk limiti: soru/prompt 2000, `context` 20.000 karakter.
- Uydurma fallback'ler kaldırıldı:
  - `copilot`, anahtar yokken `200 { text: "AI asistanı yapılandırılmadı…", source: "unconfigured" }` döner.
  - `suggest-reply`, anahtar yokken `503 AI_NOT_CONFIGURED` döner (müşteriye gidecek taslak üretilmez).
  - Gemini hatası/boş yanıt → `502 AI_UNAVAILABLE`. Sahte "analiz tamamlandı" metni yoktur.
- Copilot bağlamı sunucuda tenant'a özel DB verisinden üretilir (duruma göre sipariş sayıları, kritik stok ≤ 5, en fazla 10 ürün). İstemci `context`'i yalnızca "doğrulanmamış ek bağlam" olarak iletilir.
- AI rotalarında tenant bazlı rate limit (`express-rate-limit`, ADR 0002): dakikada 20 istek, anahtar = oturumdaki `tenantId`.
- AI çıktısı hiçbir yerde otomatik gönderilmez; kullanıcı onayı arayüzdedir.
- Yeni bağımlılık yok. Testte Gemini istemcisi `createApp({ ai: { getClient } })` ile enjekte edilir.

## Değerlendirilen alternatifler

- **Anahtar yokken kural tabanlı yanıt:** rakamları uydurduğu için reddedildi.
- **İstemci `context`'ini tamamen kaldırmak:** iade ekranı henüz DB'siz mock veriyi bağlam olarak gönderiyor; sınırlı ve etiketli olarak korundu.

## Sonuçlar

- API sözleşmesi değişti: `source: "rules" | "template" | "fallback"` artık dönmez; `suggest-reply` anahtarsızken 503 verir. Arayüz bu durumda kendi yerel metnine düşer (arayüz tarafındaki sabit şablon bu işin kapsamı dışında).
- Rate limit sayacı bellek içidir (ADR 0002 sonuçları geçerli).
